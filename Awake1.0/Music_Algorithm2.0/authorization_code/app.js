//var myArgs = process.argv.slice(2)
var sample = []
var music_features = []
var structure = []
var id_user
var email
var count = 0
var json
var options
var url_route = '/temp'
var access_token
var newData = []
/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */
var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var client_id = '257ae08bebe54229b24810dc5fe46411'; // Your client id
var client_secret = '1e9532fd210248ffa787c3623f3c8f5b'; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri
var SpotifyWebApi = require('spotify-web-api-node');
// credentials are optional
var spotifyApi = new SpotifyWebApi({
  clientId : client_id,
  clientSecret : client_secret,
  redirectUri : redirect_uri
});

function diff_length(time1, time2) 
     {
        var minute = Number(time1[14] + time1[15])
        var second = Number(time1[17] + time1 [18])
        var minute2 = Number(time2[14] + time2[15])
        var second2 = Number(time2[17] + time2 [18])
        var diff_min = Math.abs(minute - minute2) * 60
        var diff_second = Math.abs(second - second2);
        var diff_total_time = diff_min + diff_second
        return diff_total_time
     }

function musicAlgorithm(song) 
      {
         var levelOfHappinness ;
          //console.log("what is happening1")
          spotifyApi.searchTracks(song)
          .then(function(data) 
                {
                  //console.log("what is happening2")
                  var id = data.body.tracks.items[0].id
                  spotifyApi.getAudioFeaturesForTrack(id)
                  .then(function(data) 
                      {
                         //console.log(data.body)
                         levelOfHappinness = ( data.body.instrumentalness*100 + (data.body.loudness*10) + data.body.tempo + (100 * data.body.energy) + (100 * data.body.valence) )/26.3
                         //console.log(data.body)
                         //console.log(song)
                        //console.log(levelOfHappinness)
                        //  music_features.push(data.body)
                         json = {"x": count , "y" : levelOfHappinness}
                         sample.push(json)
                         count++
                        //console.log(sample)
                       }, function(err) 
                              {
                                 done(err);
                               });
                      }, function(err) 
                              {
                               console.error(err);
                              });
            return levelOfHappinness ;
           }

function listening(json_uri)
     {
         var listen_music = 
             {
                url: 'https://api.spotify.com/v1/me/player/play',
                headers: 
                   {
                      'Authorization': 'Bearer ' + access_token,
                      'Accept': 'application/json',
                      'Content-Type': 'application/json'
                    },
               json: 
                    { 
                      "uris":[json_uri]}
                    };
          //"spotify:track:4iV5W9uYEdYUVa79Axb7Rh"
               request.put(listen_music, function(error, response, body) 
                    {
                       console.log("successful")
               })
     }

function generateMoodData()
    {
     request.get('https://api.spotify.com/v1/me/player/recently-played', options, function(error, response, body) 
           {
               var list_song = []
               var count = 0 ;
               var happy ;
               body.items.forEach(function(element) 
                  {
                      //console.log(element.played_at)
                      var song = element.track.artists[0].name + " " +  element.track.name
                      //list_song.push(song)
                      setTimeout( () => 
                             {
                                musicAlgorithm(song)
                              }, 100 )
                 })
           });
      }
/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
var text = '';
var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) 
      {
         text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
   return text;
    };

var stateKey = 'spotify_auth_state';
var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cookieParser());

app.get('/login', function(req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);
  // your application requests authorization
  var scope = 'user-read-private user-read-email user-read-recently-played user-modify-playback-state ';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/trueData', function(req,res)
    {
      generateMoodData()
    })

app.get('/callback', function(req, res) {
  // your application requests refresh and access tokens
  // after checking the state parameter
  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;
  if (state === null || state !== storedState) 
     {
         res.redirect('/#' +
         querystring.stringify({
         error: 'state_mismatch'
      }));
     } 
     else 
        {
           res.clearCookie(stateKey);
           var authOptions = {
           url: 'https://accounts.spotify.com/api/token',
           form: {
           code: code,
           redirect_uri: redirect_uri,
           grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };
  request.post(authOptions, function(error, response, body) {
  if (!error && response.statusCode === 200) 
     {
        access_token = body.access_token,
        refresh_token = body.refresh_token;
        options = 
             {
                 url: 'https://api.spotify.com/v1/me',
                 headers: { 'Authorization': 'Bearer ' + access_token },
                 json: true
             };
        spotifyApi.setAccessToken(access_token);
        spotifyApi.getFeaturedPlaylists({ limit : 3, offset: 1, country: 'US' })
        .then(function(data) 
              {
                //console.log(data.body.playlists.items);
              }, function(err) 
              {
                //console.log("Something went wrong!", err);
              });

        spotifyApi.getMe()
        .then(function(data) 
              {
                 email = data.body.email
                 id_user = data.body.id
                 url_request = 'https://api.spotify.com/v1/users/spotify/playlists/37i9dQZF1DX3qCx5yEZkcJ/tracks'
                 get_tracks =
                      {
                          headers: 
                              {
                                  'Authorization': 'Bearer ' + access_token
                              }
                       };

                  request.get(url_request, options, function(error, response, body) {
                  var last_id
                  body.items.forEach(function(element) 
                       {
                          // just testing
                          var song = element.track.artists[0].name + " " +  element.track.name
                          //console.log(song)
                          // add music Algorithm
                          //console.log(element.track.id)
                          last_id = element.track.id
                           //"spotify:track:4iV5W9uYEdYUVa79Axb7Rh"
                          //console.log("new song")
                       });
               var song_url = "spotify:track:" + last_id
               listening(song_url)
           });
     var myJSONObject = {'id': id_user, 'email': email};
     request(
        {
            url: 'http://localhost:3000/api/users',
            method: "POST",
            json: true,   // <--Very important!!!
             body: myJSONObject
       }, function (error, response, body)
           {
              //console.log(response);
            })
         
    url_route = '/moodData'.concat(email)
    console.log(url_route)
         
    app.get(url_route, function(req, res)
         {
              newData = []
              sample = []
              count = 0
              generateMoodData()
              function receiveData()
         {
               newData.push(sample)
               //newData.push(music_features)
               //console.log(newData)
               return res.status(200).json({mood: newData})
        }
                setTimeout(receiveData, 3000)
        })
    /*app.get(url_route + '1', function(req, res)
    {
       newData = []
       sample = []
       count = 0
       generateMoodData()
       function receiveData()
           {
              newData.push(sample)
              //newData.push(music_features)
              console.log(newData)
              return res.status(200).json({mood: music_features})
           }
     setTimeout(receiveData, 2500)
    })*/

  }, function(err) {
    console.log('Something went wrong!', err);
  });

  res.redirect('/#' +  querystring.stringify(
                          {
                              access_token: access_token,
                              refresh_token: refresh_token
                          }));
          } 
    else
         {
           res.redirect('/#' +
            querystring.stringify({
            error: 'invalid_token'
           }));
        }
     });
   }
 });

/////////////////////////////////////////////////////////////////
//'/api/tags/:tagid'
///////////////////////////////////////////////////////////////
app.get('/refresh_token', function(req, res) 
   {
      // requesting access token from refresh token
      var refresh_token = req.query.refresh_token;
      var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      headers: 
        { 
         'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
         form: 
           {
             grant_type: 'refresh_token',
             refresh_token: refresh_token
           },
         json: true
        };
    request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) 
        {
           var access_token = body.access_token;
            res.send(
             {
                'access_token': access_token
             });
          }
       });
   });

console.log('Listening on 8888');
app.listen(8888);
