// AngularJS Application Module
var app = angular.module('soundtrackApp', ['ngRoute', 'ngAnimate']);

// Configuration
app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
  $locationProvider.hashPrefix('');
  
  $routeProvider
    .when('/', {
      templateUrl: 'views/home.html',
      controller: 'HomeController'
    })
    .when('/login', {
      templateUrl: 'views/login.html',
      controller: 'AuthController'
    })
    .when('/signup', {
      templateUrl: 'views/signup.html',
      controller: 'AuthController'
    })
    .when('/spotify-connect', {
      templateUrl: 'views/spotify-connect.html',
      controller: 'SpotifyConnectController'
    })
    .when('/dashboard', {
      templateUrl: 'views/dashboard.html',
      controller: 'DashboardController'
    })
    .when('/moment/:id', {
      templateUrl: 'views/moment-detail.html',
      controller: 'MomentDetailController'
    })
    .when('/profile', {
      templateUrl: 'views/profile.html',
      controller: 'ProfileController'
    })
    .otherwise({
      redirectTo: '/'
    });
}]);

// Services - HYBRID: Firestore + localStorage
app.service('AuthService', ['$q', '$timeout', function($q, $timeout) {
  var self = this;
  this.isAuthenticated = false;
  this.currentUser = null;
  
  // Helper to check if Firebase is available
  this.isFirebaseReady = function() {
    return typeof window !== 'undefined' && window.auth && window.db;
  };
  
  // Helper to convert Firebase user to app format
  this.formatUser = function(firebaseUser) {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
      avatar: firebaseUser.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(firebaseUser.email),
      emailVerified: firebaseUser.emailVerified
    };
  };
  
  // Login with Firebase Auth + localStorage fallback
  this.login = function(email, password) {
    var deferred = $q.defer();
    
    if (this.isFirebaseReady()) {
      // PRIMARY: Firebase Auth
      import('https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js').then(function(module) {
        var signInWithEmailAndPassword = module.signInWithEmailAndPassword;
        signInWithEmailAndPassword(window.auth, email, password)
          .then(function(userCredential) {
            var user = self.formatUser(userCredential.user);
            self.currentUser = user;
            self.isAuthenticated = true;
            
            // Save to localStorage as backup
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('authenticated', 'true');
            localStorage.setItem('firebase_uid', userCredential.user.uid);
            
            // Create/update user doc in Firestore
            self.createUserDoc(userCredential.user.uid, user);
            
            deferred.resolve(user);
          })
          .catch(function(error) {
            console.warn('Firebase login failed, trying localStorage fallback:', error.message);
            // FALLBACK: localStorage
            var cachedUser = JSON.parse(localStorage.getItem('user') || 'null');
            if (cachedUser && cachedUser.email === email) {
              self.currentUser = cachedUser;
              self.isAuthenticated = true;
              deferred.resolve(cachedUser);
            } else {
              deferred.reject(error);
            }
          });
      }).catch(function(err) {
        // Firebase not available, use localStorage
        var cachedUser = JSON.parse(localStorage.getItem('user') || 'null');
        if (cachedUser && cachedUser.email === email) {
          self.currentUser = cachedUser;
          self.isAuthenticated = true;
          deferred.resolve(cachedUser);
        } else {
          deferred.reject(new Error('Firebase not available and no cached user'));
        }
      });
    } else {
      // FALLBACK: localStorage only
      var cachedUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (cachedUser && cachedUser.email === email) {
        self.currentUser = cachedUser;
        self.isAuthenticated = true;
        deferred.resolve(cachedUser);
      } else {
        deferred.reject(new Error('Firebase not initialized'));
      }
    }
    
    return deferred.promise;
  };
  
  // Signup with Firebase Auth + localStorage fallback
  this.signup = function(email, password, name) {
    var deferred = $q.defer();
    
    if (this.isFirebaseReady()) {
      import('https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js').then(function(module) {
        var createUserWithEmailAndPassword = module.createUserWithEmailAndPassword;
        createUserWithEmailAndPassword(window.auth, email, password)
          .then(function(userCredential) {
            // Update display name if provided
            if (name) {
              var updateProfile = module.updateProfile;
              updateProfile(userCredential.user, { displayName: name });
            }
            
            var user = self.formatUser(userCredential.user);
            if (name) user.name = name;
            self.currentUser = user;
            self.isAuthenticated = true;
            
            // Save to localStorage as backup
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('authenticated', 'true');
            localStorage.setItem('firebase_uid', userCredential.user.uid);
            
            // Create user doc in Firestore
            self.createUserDoc(userCredential.user.uid, user);
            
            deferred.resolve(user);
          })
          .catch(function(error) {
            console.warn('Firebase signup failed:', error.message);
            deferred.reject(error);
          });
      });
    } else {
      // FALLBACK: localStorage only
      var user = {
        email: email,
        name: name || email.split('@')[0],
        avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name || email)
      };
      self.currentUser = user;
      self.isAuthenticated = true;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('authenticated', 'true');
      deferred.resolve(user);
    }
    
    return deferred.promise;
  };
  
  // Create/update user document in Firestore
  this.createUserDoc = function(uid, userData) {
    if (!this.isFirebaseReady()) return;
    
    import('https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js').then(function(module) {
      var doc = module.doc;
      var setDoc = module.setDoc;
      var serverTimestamp = module.serverTimestamp;
      
      var userRef = doc(window.db, 'users', uid);
      setDoc(userRef, {
        email: userData.email,
        displayName: userData.name,
        spotifyConnected: false,
        spotifyUserId: null,
        createdAt: serverTimestamp(),
        totalMoments: 0
      }, { merge: true }).catch(function(err) {
        console.warn('Failed to create user doc:', err);
      });
    });
  };
  
  // Logout
  this.logout = function() {
    if (this.isFirebaseReady() && window.auth) {
      import('https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js').then(function(module) {
        var signOut = module.signOut;
        signOut(window.auth).catch(function(err) {
          console.warn('Firebase logout error:', err);
        });
      });
    }
    
    this.isAuthenticated = false;
    this.currentUser = null;
    localStorage.removeItem('user');
    localStorage.removeItem('authenticated');
    localStorage.removeItem('firebase_uid');
  };
  
  // Check authentication state
  this.checkAuth = function() {
    if (this.isFirebaseReady() && window.auth) {
      // Check Firebase auth state
      import('https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js').then(function(module) {
        var onAuthStateChanged = module.onAuthStateChanged;
        onAuthStateChanged(window.auth, function(user) {
          if (user) {
            self.currentUser = self.formatUser(user);
            self.isAuthenticated = true;
            localStorage.setItem('user', JSON.stringify(self.currentUser));
            localStorage.setItem('authenticated', 'true');
            localStorage.setItem('firebase_uid', user.uid);
          } else {
            // Check localStorage fallback
            var cachedUser = JSON.parse(localStorage.getItem('user') || 'null');
            if (cachedUser) {
              self.currentUser = cachedUser;
              self.isAuthenticated = true;
            }
          }
        });
      });
    } else {
      // Fallback to localStorage
      var authenticated = localStorage.getItem('authenticated') === 'true';
      if (authenticated) {
        var user = localStorage.getItem('user');
        if (user) {
          this.currentUser = JSON.parse(user);
          this.isAuthenticated = true;
        }
      }
    }
  };
  
  // Initialize auth check
  $timeout(function() {
    self.checkAuth();
  }, 500);
}]);

app.service('SpotifyService', ['$q', '$http', function($q, $http) {
  var self = this;
  var API_BASE = 'https://soundtrackgen-backend.onrender.com';
  var STORAGE_KEYS = {
    SPOTIFY_STATE: 'spotify_state',
    AUTH_FLAG: 'spotify_connected'
  };
  
  this.isConnected = localStorage.getItem(STORAGE_KEYS.AUTH_FLAG) === 'true';
  this.sessionState = localStorage.getItem(STORAGE_KEYS.SPOTIFY_STATE);
  
  function ensureState() {
    if (self.sessionState) return self.sessionState;
    self.sessionState = Math.random().toString(36).substring(2);
    localStorage.setItem(STORAGE_KEYS.SPOTIFY_STATE, self.sessionState);
    return self.sessionState;
  }
  
  this.connect = function() {
    var state = ensureState();
    window.location.href = API_BASE + '/login?state=' + state;
  };
  
  this.disconnect = function() {
    localStorage.removeItem(STORAGE_KEYS.AUTH_FLAG);
    localStorage.removeItem(STORAGE_KEYS.SPOTIFY_STATE);
    self.sessionState = null;
    self.isConnected = false;
    fetch(API_BASE + '/api/spotify/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: ensureState() })
    }).catch(function() {});
  };
  
  this.handleAuthRedirect = function(url) {
    var query = url.split('?')[1];
    if (!query) return $q.resolve(false);
    var params = new URLSearchParams(query);
    if (params.get('error')) {
      return $q.reject(params.get('error'));
    }
    if (!params.get('hasTokens')) {
      return $q.resolve(false);
    }
    var state = params.get('state') || ensureState();
    localStorage.setItem(STORAGE_KEYS.SPOTIFY_STATE, state);
    localStorage.setItem(STORAGE_KEYS.AUTH_FLAG, 'true');
    self.isConnected = true;
    window.history.replaceState({}, document.title, window.location.pathname + '#/spotify-connect');
    return $q.resolve(true);
  };
  
  function fetchTracksFromBackend(mood, timeOfDay, market) {
    return fetch(API_BASE + '/api/spotify/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        state: self.sessionState || 'default',
        mood: mood || 'neutral',
        timeOfDay: timeOfDay || 'afternoon',
        market: market || 'US'
      })
    })
      .then(function(res) {
        if (!res.ok) {
          throw new Error('Recommendations failed: ' + res.statusText);
        }
        return res.json();
      })
      .then(function(data) {
        if (!Array.isArray(data)) {
          // Backend returns { tracks: [...] }
          return data.tracks || [];
        }
        return data;
      })
      .then(function(tracks) {
        return tracks.map(function(track) {
          return {
            id: track.id,
            uri: track.uri,
            name: track.name || 'Unknown Track',
            artist: track.artist || 'Unknown Artist',
            album: track.album || 'Unknown Album',
            duration_ms: track.duration_ms || track.durationms || 0,
            image: track.image || '',
            duration: formatDuration(track.duration_ms || track.durationms || 0)
          };
        });
      })
      .catch(function(err) {
        console.error('fetchTracksFromBackend error:', err);
        throw err;
      });
  }
  
  function createRemotePlaylist(name, description, trackUris) {
    return fetch(API_BASE + '/api/spotify/create-playlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state: ensureState(),
        playlistName: name,
        description: description,
        trackUris: trackUris
      })
    }).then(function(res) {
      if (!res.ok) throw new Error('Playlist creation failed');
      return res.json();
    });
  }
  
  function formatDuration(ms) {
    var totalSeconds = Math.round(ms / 1000);
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    return minutes + ':' + (seconds < 10 ? '0' + seconds : seconds);
  }
  
  function createRemotePlaylist(name, description, trackUris) {
    if (!self.spotifyUser || !self.spotifyUser.id) {
      return $q.reject('Missing Spotify user profile.');
    }
    return fetch('https://api.spotify.com/v1/users/' + self.spotifyUser.id + '/playlists', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + self.accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: name,
        description: description,
        public: false
      })
    }).then(function(res) {
      if (!res.ok) {
        throw new Error('Failed to create Spotify playlist');
      }
      return res.json();
    }).then(function(playlist) {
      if (trackUris && trackUris.length) {
        return fetch('https://api.spotify.com/v1/playlists/' + playlist.id + '/tracks', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + self.accessToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ uris: trackUris })
        }).then(function() {
          return playlist;
        });
      }
      return playlist;
    });
  }
  
  this.buildMockPlaylist = function(moodData) {
    var fallbackTracks = [
      {
        id: 'mock-1',
        name: 'City Lights',
        artist: 'Analog Dreams',
        album: 'Neon Nights',
        duration: '3:42',
        image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=300&h=300&fit=crop'
      },
      {
        id: 'mock-2',
        name: 'Morning Glow',
        artist: 'Golden Hour',
        album: 'Sunrise Stories',
        duration: '4:05',
        image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300&h=300&fit=crop'
      }
    ];
    return {
      id: Date.now().toString(),
      name: moodData.mood.charAt(0).toUpperCase() + moodData.mood.slice(1) + ' Soundtrack - ' + new Date().toLocaleDateString(),
      mood: moodData.mood,
      weather: moodData.weather,
      location: moodData.location,
      time: moodData.time,
      tracks: fallbackTracks,
      coverImage: fallbackTracks[0].image,
      createdAt: new Date().toISOString()
    };
  };
  
  this.generatePlaylist = function(moodData) {
    var deferred = $q.defer();
    
    // If Spotify not connected, use fallback
    if (!self.isConnected) {
      console.warn('Spotify not connected, using mock');
      return $q.resolve(self.buildMockPlaylist(moodData));
    }
    
    // Ensure mood and time are valid
    if (!moodData.mood) {
      moodData.mood = 'neutral';
    }
    if (!moodData.time) {
      moodData.time = 'afternoon';
    }
    
    // Call backend for recommendations
    return fetchTracksFromBackend(moodData.mood, moodData.time, 'US')
      .then(function(tracks) {
        if (!tracks || tracks.length === 0) {
          console.warn('No tracks from backend, using fallback');
          return self.buildMockPlaylist(moodData);
        }
        
        var playlist = {
          id: Date.now().toString(),
          name: moodData.mood.charAt(0).toUpperCase() + moodData.mood.slice(1) + 
                ' ' + moodData.time.charAt(0).toUpperCase() + moodData.time.slice(1) + 
                ' Soundtrack - ' + new Date().toLocaleDateString(),
          mood: moodData.mood,
          time: moodData.time,
          weather: moodData.weather || {},
          location: moodData.location || 'Unknown',
          tracks: tracks,
          coverImage: tracks[0] ? tracks[0].image : '',
          createdAt: new Date().toISOString(),
          spotifyPlaylistId: null,
          spotifyPlaylistUrl: null
        };
        
        // Try to create real Spotify playlist
        if (tracks[0] && tracks[0].uri) {
          var trackUris = tracks.map(function(t) { return t.uri; });
          return createRemotePlaylist(playlist.name, 'Generated by SoundtrackGen', trackUris)
            .then(function(remote) {
              playlist.spotifyPlaylistId = remote.playlistId;
              playlist.spotifyPlaylistUrl = remote.playlistUrl;
              return playlist;
            })
            .catch(function(err) {
              console.warn('Failed to create Spotify playlist, continuing without it', err);
              return playlist;
            });
        }
        
        return playlist;
      })
      .catch(function(err) {
        console.error('Backend error:', err);
        return self.buildMockPlaylist(moodData);
      });
  };
  
  this.savePlaylistToSpotify = function(playlist) {
    if (!self.isConnected) {
      return $q.reject('Spotify not connected');
    }
    var trackUris = playlist.tracks.map(function(t) { return t.uri; }).filter(Boolean);
    return createRemotePlaylist(playlist.name, 'Generated by SoundtrackGen', trackUris);
  };
}]);

// MomentService - HYBRID: Firestore + localStorage
app.service('MomentService', ['$q', '$timeout', 'AuthService', function($q, $timeout, AuthService) {
  var self = this;
  this.moments = [];
  this.loading = false;
  
  // Helper to check if Firebase is available
  this.isFirebaseReady = function() {
    return typeof window !== 'undefined' && window.db && AuthService.isAuthenticated && AuthService.currentUser && AuthService.currentUser.uid;
  };
  
  // Helper to convert Firestore timestamp
  this.convertTimestamp = function(timestamp) {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toISOString();
    }
    return new Date().toISOString();
  };
  
  // Save moment - PRIMARY: Firestore, FALLBACK: localStorage
  this.saveMoment = function(moment) {
    var deferred = $q.defer();
    var uid = AuthService.currentUser ? AuthService.currentUser.uid : null;
    
    // Ensure moment has required fields
    if (!moment.id) {
      moment.id = Date.now().toString();
    }
    if (!moment.createdAt) {
      moment.createdAt = new Date().toISOString();
    }
    
    if (this.isFirebaseReady() && uid) {
      // PRIMARY: Save to Firestore
      import('https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js').then(function(module) {
        var collection = module.collection;
        var addDoc = module.addDoc;
        var serverTimestamp = module.serverTimestamp;
        var doc = module.doc;
        var setDoc = module.setDoc;
        
        var momentsRef = collection(window.db, 'users', uid, 'moments');
        var momentData = {
          mood: moment.mood,
          weather: moment.weather,
          location: moment.location,
          time: moment.time,
          spotifyPlaylistId: moment.spotifyPlaylistId || null,
          tracks: moment.tracks,
          createdAt: serverTimestamp()
        };
        
        addDoc(momentsRef, momentData)
          .then(function(docRef) {
            // Add Firestore ID to moment
            moment.firestoreId = docRef.id;
            
            // BACKUP: Save to localStorage
            var localMoments = JSON.parse(localStorage.getItem('moments') || '[]');
            // Remove duplicate if exists
            localMoments = localMoments.filter(function(m) {
              return m.id !== moment.id && m.firestoreId !== docRef.id;
            });
            localMoments.unshift(moment);
            localStorage.setItem('moments', JSON.stringify(localMoments));
            
            // Update local cache
            self.moments.unshift(moment);
            
            // Update user totalMoments count
            var userRef = doc(window.db, 'users', uid);
            setDoc(userRef, {
              totalMoments: self.moments.length
            }, { merge: true });
            
            deferred.resolve(moment);
          })
          .catch(function(error) {
            console.warn('Firestore save failed, using localStorage:', error);
            // FALLBACK: localStorage only
            var localMoments = JSON.parse(localStorage.getItem('moments') || '[]');
            localMoments.unshift(moment);
            localStorage.setItem('moments', JSON.stringify(localMoments));
            self.moments.unshift(moment);
            deferred.resolve(moment);
          });
      }).catch(function(err) {
        // Firebase not available, use localStorage
        var localMoments = JSON.parse(localStorage.getItem('moments') || '[]');
        localMoments.unshift(moment);
        localStorage.setItem('moments', JSON.stringify(localMoments));
        self.moments.unshift(moment);
        deferred.resolve(moment);
      });
    } else {
      // FALLBACK: localStorage only
      var localMoments = JSON.parse(localStorage.getItem('moments') || '[]');
      localMoments.unshift(moment);
      localStorage.setItem('moments', JSON.stringify(localMoments));
      this.moments.unshift(moment);
      deferred.resolve(moment);
    }
    
    return deferred.promise;
  };
  
  // Get all moments - Merge Firestore + localStorage, dedupe
  this.getAllMoments = function() {
    var deferred = $q.defer();
    var uid = AuthService.currentUser ? AuthService.currentUser.uid : null;
    
    if (this.isFirebaseReady() && uid) {
      // PRIMARY: Load from Firestore
      import('https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js').then(function(module) {
        var collection = module.collection;
        var query = module.query;
        var orderBy = module.orderBy;
        var getDocs = module.getDocs;
        
        var momentsRef = collection(window.db, 'users', uid, 'moments');
        var q = query(momentsRef, orderBy('createdAt', 'desc'));
        
        getDocs(q)
          .then(function(querySnapshot) {
            var firestoreMoments = [];
            querySnapshot.forEach(function(docSnap) {
              var data = docSnap.data();
              firestoreMoments.push({
                id: docSnap.id,
                firestoreId: docSnap.id,
                mood: data.mood,
                weather: data.weather,
                location: data.location,
                time: data.time,
                spotifyPlaylistId: data.spotifyPlaylistId,
                tracks: data.tracks,
                coverImage: data.tracks && data.tracks[0] ? data.tracks[0].image : null,
                name: (data.mood ? data.mood.charAt(0).toUpperCase() + data.mood.slice(1) : 'Unknown') + ' Soundtrack',
                createdAt: self.convertTimestamp(data.createdAt)
              });
            });
            
            // MERGE: Get localStorage moments
            var localMoments = JSON.parse(localStorage.getItem('moments') || '[]');
            
            // DEDUPE: Merge and remove duplicates
            var merged = firestoreMoments.slice();
            var firestoreIds = {};
            firestoreMoments.forEach(function(m) {
              if (m.firestoreId) firestoreIds[m.firestoreId] = true;
              if (m.id) firestoreIds[m.id] = true;
            });
            
            localMoments.forEach(function(localMoment) {
              var isDuplicate = false;
              if (localMoment.firestoreId && firestoreIds[localMoment.firestoreId]) {
                isDuplicate = true;
              } else if (localMoment.id && firestoreIds[localMoment.id]) {
                isDuplicate = true;
              }
              
              if (!isDuplicate) {
                merged.push(localMoment);
              }
            });
            
            // Sort by createdAt
            merged.sort(function(a, b) {
              var dateA = new Date(a.createdAt || 0);
              var dateB = new Date(b.createdAt || 0);
              return dateB - dateA;
            });
            
            self.moments = merged;
            // Update localStorage with merged data
            localStorage.setItem('moments', JSON.stringify(merged));
            deferred.resolve(merged);
          })
          .catch(function(error) {
            console.warn('Firestore load failed, using localStorage:', error);
            // FALLBACK: localStorage only
            var localMoments = JSON.parse(localStorage.getItem('moments') || '[]');
            self.moments = localMoments;
            deferred.resolve(localMoments);
          });
      }).catch(function(err) {
        // Firebase not available
        var localMoments = JSON.parse(localStorage.getItem('moments') || '[]');
        self.moments = localMoments;
        deferred.resolve(localMoments);
      });
    } else {
      // FALLBACK: localStorage only
      var localMoments = JSON.parse(localStorage.getItem('moments') || '[]');
      this.moments = localMoments;
      deferred.resolve(localMoments);
    }
    
    return deferred.promise;
  };
  
  // Get single moment
  this.getMoment = function(id) {
    // First check local cache
    for (var i = 0; i < this.moments.length; i++) {
      if (this.moments[i].id === id || this.moments[i].firestoreId === id) {
        return this.moments[i];
      }
    }
    
    // Check localStorage
    var localMoments = JSON.parse(localStorage.getItem('moments') || '[]');
    for (var j = 0; j < localMoments.length; j++) {
      if (localMoments[j].id === id || localMoments[j].firestoreId === id) {
        return localMoments[j];
      }
    }
    
    return null;
  };
  
  // Get recent moments
  this.getRecentMoments = function(limit) {
    limit = limit || 4;
    var deferred = $q.defer();
    
    if (this.moments.length === 0) {
      // Load if not already loaded
      this.getAllMoments().then(function(moments) {
        deferred.resolve(moments.slice(0, limit));
      });
    } else {
      deferred.resolve(this.moments.slice(0, limit));
    }
    
    return deferred.promise;
  };
  
  // Sync localStorage to Firestore (for offline recovery)
  this.syncLocalToFirestore = function() {
    if (!this.isFirebaseReady()) return $q.resolve();
    
    var deferred = $q.defer();
    var uid = AuthService.currentUser ? AuthService.currentUser.uid : null;
    if (!uid) {
      deferred.resolve();
      return deferred.promise;
    }
    
    var localMoments = JSON.parse(localStorage.getItem('moments') || '[]');
    var momentsToSync = localMoments.filter(function(m) {
      return !m.firestoreId; // Only sync moments without Firestore ID
    });
    
    if (momentsToSync.length === 0) {
      deferred.resolve();
      return deferred.promise;
    }
    
    import('https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js').then(function(module) {
      var collection = module.collection;
      var serverTimestamp = module.serverTimestamp;
      var writeBatch = module.writeBatch;
      var doc = module.doc;
      
      var db = window.db;
      var batch = writeBatch(db);
      
      momentsToSync.forEach(function(moment) {
        var momentsRef = collection(db, 'users', uid, 'moments');
        var momentData = {
          mood: moment.mood,
          weather: moment.weather,
          location: moment.location,
          time: moment.time,
          spotifyPlaylistId: moment.spotifyPlaylistId || null,
          tracks: moment.tracks,
          createdAt: serverTimestamp()
        };
        var docRef = doc(momentsRef);
        batch.set(docRef, momentData);
      });
      
      batch.commit()
        .then(function() {
          console.log('Synced ' + momentsToSync.length + ' moments to Firestore');
          deferred.resolve();
        })
        .catch(function(error) {
          console.warn('Sync failed:', error);
          deferred.reject(error);
        });
    });
    
    return deferred.promise;
  };
  
  // Initialize: Load moments on service creation
  $timeout(function() {
    if (AuthService.isAuthenticated) {
      self.getAllMoments();
    }
  }, 1000);
}]);

app.service('WeatherService', ['$q', function($q) {
  var DEFAULT_CONTEXT = {
    location: 'Unknown location',
    weather: {
      temp: 22,
      condition: 'clear',
      icon: '☀️',
      description: 'Clear skies'
    }
  };
  
  function resolveGeolocation(timeoutMs) {
    return new Promise(function(resolve, reject) {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      var resolved = false;
      var timer = setTimeout(function() {
        if (!resolved) {
          resolved = true;
          reject(new Error('Location timeout'));
        }
      }, timeoutMs || 8000);
      navigator.geolocation.getCurrentPosition(function(position) {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      }, function(err) {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        reject(err);
      }, {
        enableHighAccuracy: false,
        timeout: timeoutMs || 8000,
        maximumAge: 600000
      });
    });
  }
  
  function reverseGeocode(lat, lon) {
    var url = 'https://api.bigdatacloud.net/data/reverse-geocode-client?latitude='
      + lat + '&longitude=' + lon + '&localityLanguage=en';
    return fetch(url)
      .then(function(res) { return res.ok ? res.json() : null; })
      .then(function(data) {
        if (!data) return null;
        var city = data.city || data.locality || data.principalSubdivision || '';
        var countryCode = data.countryCode || 'US';
        return {
          location: city ? city + ', ' + (data.principalSubdivision || data.countryName || '') : data.countryName || 'Unknown location',
          countryCode: countryCode
        };
      }).catch(function() {
        return null;
      });
  }
  
  function fetchWeather(lat, lon) {
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current_weather=true';
    return fetch(url)
      .then(function(res) { return res.ok ? res.json() : null; })
      .then(function(data) {
        if (!data || !data.current_weather) {
          return null;
        }
        var weather = data.current_weather;
        var icon = weather.weathercode <= 2 ? '☀️' : weather.weathercode <= 45 ? '🌤️' : '🌧️';
        return {
          temp: Math.round(weather.temperature),
          condition: weather.weathercode,
          icon: icon,
          description: icon === '☀️' ? 'Sunny' : icon === '🌤️' ? 'Partly cloudy' : 'Moody skies'
        };
      }).catch(function() {
        return null;
      });
  }
  
  this.getFallbackContext = function() {
    return angular.copy(DEFAULT_CONTEXT);
  };
  
  this.getLocationAndWeather = function() {
    var deferred = $q.defer();
    resolveGeolocation(9000)
      .then(function(coords) {
        return Promise.all([
          reverseGeocode(coords.latitude, coords.longitude),
          fetchWeather(coords.latitude, coords.longitude)
        ]).then(function(results) {
          var locationInfo = results[0];
          var weatherInfo = results[1];
          deferred.resolve({
            location: (locationInfo && locationInfo.location) || DEFAULT_CONTEXT.location,
            locationMeta: locationInfo,
            weather: weatherInfo || DEFAULT_CONTEXT.weather
          });
        });
      })
      .catch(function() {
        deferred.resolve({
          location: DEFAULT_CONTEXT.location,
          weather: DEFAULT_CONTEXT.weather,
          locationMeta: null
        });
      });
    return deferred.promise;
  };
}]);

// Controllers
app.controller('MainController', ['$scope', 'AuthService', 'SpotifyService', function($scope, AuthService, SpotifyService) {
  $scope.auth = AuthService;
  $scope.spotify = SpotifyService;
  $scope.darkMode = localStorage.getItem('darkMode') === 'true' || false;
  
  $scope.toggleDarkMode = function() {
    $scope.darkMode = !$scope.darkMode;
    localStorage.setItem('darkMode', $scope.darkMode.toString());
    if ($scope.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  if ($scope.darkMode) {
    document.documentElement.classList.add('dark');
  }
  
  $scope.logout = function() {
    AuthService.logout();
    window.location.hash = '/';
  };
}]);

app.controller('HomeController', ['$scope', '$http', function ($scope, $http) {

  // sample cards already in your UI
  $scope.sampleMoments = [
    { mood: 'happy',     image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop', title: 'Sunny Morning' },
    { mood: 'chill',     image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop', title: 'Evening Vibes' },
    { mood: 'focus',     image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop', title: 'Work Session' },
    { mood: 'energetic', image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=400&fit=crop', title: 'Workout Time' },
    { mood: 'nostalgic', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop', title: 'Memories' },
    { mood: 'happy',     image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop', title: 'Weekend Fun' },
    { mood: 'chill',     image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop', title: 'Rainy Day' },
    { mood: 'focus',     image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=400&fit=crop', title: 'Study Mode' }
  ];

  // default values for generator controls
  $scope.mood = 'happy';
  $scope.weather = 'sunny';
  $scope.timeOfDay = 'afternoon';
  $scope.lastPlaylistUrl = null;

  // call Node backend to generate playlist
  $scope.generateSoundtrack = function () {
    var body = {
      mood: $scope.mood,
      weather: $scope.weather,
      timeOfDay: $scope.timeOfDay,
      location: 'IN'
    };

    $http.post('http://127.0.0.1:3000/generate-soundtrack', body)
      .then(function (response) {
        $scope.lastPlaylistUrl = response.data.playlistUrl;
        window.open(response.data.playlistUrl, '_blank');
      })
      .catch(function (error) {
        console.error('Frontend error:', error);
        alert('Failed to generate playlist');
      });
  };

}]);


app.controller('AuthController', ['$scope', '$location', 'AuthService', function($scope, $location, AuthService) {
  $scope.isLogin = $location.path() === '/login';
  $scope.email = '';
  $scope.password = '';
  $scope.name = '';
  $scope.error = '';
  $scope.loading = false;
  
  $scope.submit = function() {
    $scope.error = '';
    $scope.loading = true;
    
    var promise = $scope.isLogin
      ? AuthService.login($scope.email, $scope.password)
      : AuthService.signup($scope.email, $scope.password, $scope.name);
    
    promise.then(function() {
      $location.path('/dashboard');
    }).catch(function(err) {
      $scope.error = (err && err.message) || err || 'Authentication failed';
    }).finally(function() {
      $scope.loading = false;
      $scope.$applyAsync();
    });
  };
}]);

app.controller('SpotifyConnectController', ['$scope', '$location', '$timeout', 'SpotifyService', function($scope, $location, $timeout, SpotifyService) {
  $scope.connecting = false;
  $scope.statusMessage = '';
  $scope.errorMessage = '';

  function initializeController() {
    var currentUrl = window.location.href;
    
    if (currentUrl.indexOf('?') > -1 || currentUrl.indexOf('&') > -1) {
      console.log('OAuth redirect detected, processing...');
      
      SpotifyService.handleAuthRedirect(currentUrl)
        .then(function(processed) {
          if (processed) {
            $scope.$apply(function() {
              $scope.statusMessage = 'Spotify connected! Redirecting you back to the dashboard...';
              $scope.connecting = false;
            });
            
            $timeout(function() {
              $location.path('/dashboard');
            }, 1500);
          } else {
            console.log('No tokens received from Spotify');
            $scope.$apply(function() {
              $scope.errorMessage = 'Spotify authentication incomplete. Please try again.';
              $scope.connecting = false;
            });
          }
        })
        .catch(function(err) {
          console.error('Spotify redirect error:', err);
          $scope.$apply(function() {
            $scope.errorMessage = typeof err === 'string' ? err : 'Unable to complete Spotify connect. Please try again.';
            $scope.connecting = false;
          });
        });
    } else {
      console.log('No OAuth params in URL - normal page load');
    }
  }

  $scope.connect = function() {
    console.log('Starting Spotify OAuth flow...');
    $scope.connecting = true;
    $scope.errorMessage = '';
    $scope.statusMessage = '';
    
    SpotifyService.connect();
  };

  $scope.disconnect = function() {
    if (confirm('Are you sure you want to disconnect Spotify?')) {
      SpotifyService.disconnect();
      $scope.statusMessage = 'Spotify disconnected successfully.';
      $scope.errorMessage = '';
      $scope.$apply();
    }
  };

  $scope.isConnected = function() {
    return SpotifyService.isConnected;
  };

  initializeController();
}]);


app.controller('DashboardController', ['$scope', '$location', 'SpotifyService', 'MomentService', 'WeatherService', function($scope, $location, SpotifyService, MomentService, WeatherService) {
  $scope.spotify = SpotifyService;
  $scope.state = {
    weatherLoading: true,
    weatherError: null,
    playlistError: null
  };
  $scope.moodData = {
    weather: { temp: 22, condition: 'clear', icon: '☀️', description: 'Finding your weather...' },
    location: 'Locating...',
    time: 'afternoon',
    mood: null
  };
  $scope.moods = [
    { id: 'happy', label: 'Happy', gradient: 'bg-gradient-to-br from-yellow-400 to-orange-500', color: '#FFD700', emoji: '😊' },
    { id: 'chill', label: 'Chill', gradient: 'bg-gradient-to-br from-indigo-500 to-purple-600', color: '#667EEA', emoji: '😌' },
    { id: 'focus', label: 'Focus', gradient: 'bg-gradient-to-br from-teal-400 to-green-500', color: '#4ECDC4', emoji: '🎯' },
    { id: 'energetic', label: 'Energetic', gradient: 'bg-gradient-to-br from-red-400 to-orange-500', color: '#FF6B6B', emoji: '⚡' },
    { id: 'nostalgic', label: 'Nostalgic', gradient: 'bg-gradient-to-br from-green-300 to-emerald-400', color: '#A8E6CF', emoji: '💭' },
    { id: 'neutral', label: 'Neutral', gradient: 'bg-gradient-to-br from-slate-600 to-slate-700', color: '#2C3E50', emoji: '😐' }
  ];
  $scope.generating = false;
  $scope.recentMoments = [];
  
  function loadRecentMoments() {
    MomentService.getRecentMoments(4).then(function(moments) {
      $scope.recentMoments = moments;
      $scope.$applyAsync();
    });
  }
  loadRecentMoments();
  
  WeatherService.getLocationAndWeather()
    .then(function(context) {
      $scope.moodData.location = context.location;
      if (context.locationMeta && context.locationMeta.countryCode) {
        $scope.moodData.location = context.location;
        $scope.moodData.locationCountryCode = context.locationMeta.countryCode;
      }
      $scope.moodData.weather = context.weather;
    })
    .catch(function() {
      var fallback = WeatherService.getFallbackContext();
      $scope.moodData.location = fallback.location;
      $scope.moodData.weather = fallback.weather;
      $scope.state.weatherError = 'Unable to access your location. Using default weather.';
    })
    .finally(function() {
      $scope.state.weatherLoading = false;
      $scope.$applyAsync();
    });
  
  $scope.selectMood = function(mood) {
    $scope.moodData.mood = mood.id;
  };
  
  $scope.generatePlaylist = function() {
    if (!$scope.moodData.mood) {
      $scope.state.playlistError = 'Please pick a mood first.';
      return;
    }
    $scope.state.playlistError = null;
    $scope.generating = true;
    SpotifyService.generatePlaylist($scope.moodData)
      .then(function(playlist) {
        return MomentService.saveMoment(playlist).then(function(moment) {
          $scope.recentMoments.unshift(moment);
          $scope.recentMoments = $scope.recentMoments.slice(0, 4);
          $location.path('/moment/' + moment.id);
        });
      })
      .catch(function(err) {
        console.error('Playlist generation failed', err);
        $scope.state.playlistError = 'Unable to generate playlist. Please try again.';
      })
      .finally(function() {
        $scope.generating = false;
        $scope.$applyAsync();
      });
  };
}]);

app.controller('MomentDetailController', ['$scope', '$routeParams', '$location', 'MomentService', function($scope, $routeParams, $location, MomentService) {
  $scope.relatedMoments = [];
  
  function setMoment(moment) {
    $scope.moment = moment;
    var related = MomentService.moments || [];
    $scope.relatedMoments = related.filter(function(item) {
      return item.id !== moment.id && item.mood === moment.mood;
    }).slice(0, 4);
    $scope.$applyAsync();
  }
  
  var cached = MomentService.getMoment($routeParams.id);
  if (cached) {
    setMoment(cached);
  } else {
    MomentService.getAllMoments().then(function() {
      var resolved = MomentService.getMoment($routeParams.id);
      if (!resolved) {
        $location.path('/dashboard');
      } else {
        setMoment(resolved);
      }
    });
  }
  
  $scope.openSpotify = function() {
    if (!$scope.moment) {
      window.open('https://open.spotify.com', '_blank');
      return;
    }
    if ($scope.moment.spotifyPlaylistUrl) {
      window.open($scope.moment.spotifyPlaylistUrl, '_blank');
    } else if ($scope.moment.spotifyPlaylistId) {
      window.open('https://open.spotify.com/playlist/' + $scope.moment.spotifyPlaylistId, '_blank');
    } else {
      window.open('https://open.spotify.com', '_blank');
    }
  };
  
  $scope.playTrack = function(track) {
    if (!track) return;
    var trackId = track.id;
    if (!trackId && track.uri) {
      var parts = track.uri.split(':');
      trackId = parts[parts.length - 1];
    }
    if (trackId) {
      window.open('https://open.spotify.com/track/' + trackId, '_blank');
    }
  };
}]);

app.controller('ProfileController', ['$scope', 'AuthService', 'SpotifyService', 'MomentService', function($scope, AuthService, SpotifyService, MomentService) {
  $scope.user = AuthService.currentUser;
  $scope.spotify = SpotifyService;
  var allMoments = MomentService.getAllMoments();
  $scope.stats = {
    totalMoments: allMoments.length,
    totalTracks: 0,
    favoriteMood: 'happy'
  };
  
  for (var i = 0; i < allMoments.length; i++) {
    $scope.stats.totalTracks += allMoments[i].tracks.length;
  }
  
  $scope.disconnectSpotify = function() {
    if (confirm('Are you sure you want to disconnect Spotify?')) {
      SpotifyService.disconnect();
      $scope.$applyAsync();
    }
  };
}]);
