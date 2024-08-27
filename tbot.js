const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const SpotifyWebApi = require('spotify-web-api-node');

// Replace with your credentials
const telegramToken = '7542331946:AAHi-yYxCqe1LRntJA8U6ySddtJLutVDELg';
const youtubeApiKey = 'AIzaSyBfpLnJC_e7wDpNRKR8h90YpqSBux3MSmM';
const spotifyClientId = '60d4fa11b1524d57a7b33a2d8899ee8b';
const spotifyClientSecret = '17c92ce18109498a8b2b2c9c802b16d8';


// Initialize the bot
const bot = new TelegramBot(telegramToken, { polling: true });

// Initialize Spotify API client
const spotifyApi = new SpotifyWebApi({
  clientId: spotifyClientId,
  clientSecret: spotifyClientSecret
});

// Function to get Spotify access token
const getSpotifyToken = async () => {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);
  } catch (error) {
    console.error('Error retrieving Spotify access token:', error);
  }
};

// Function to search for music on Spotify
const searchSpotify = async (query) => {
  try {
    const data = await spotifyApi.searchTracks(query, { limit: 1 });
    const tracks = data.body.tracks.items;
    if (tracks.length > 0) {
      return tracks[0];
    }
    return null;
  } catch (error) {
    console.error('Error searching Spotify:', error);
    return null;
  }
};

// Function to search for a video on YouTube
const searchYouTube = async (query) => {
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: 1,
        key: youtubeApiKey,
      },
    });
    if (response.data.items.length > 0) {
      return `https://www.youtube.com/watch?v=${response.data.items[0].id.videoId}`;
    }
    return null;
  } catch (error) {
    console.error('Error searching YouTube:', error);
    return null;
  }
};

// Handle all incoming messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const query = msg.text;

  // Ignore commands (e.g., /start) and empty messages
  if (query.startsWith('/') || query.trim() === '') {
    return;
  }

  try {
    // Get Spotify token
    await getSpotifyToken();

    // Search for the music on Spotify
    const track = await searchSpotify(query);
    if (track) {
      const message = `*Title:* ${track.name}\n*Artist:* ${track.artists[0].name}\n*Album:* ${track.album.name}\n*Preview:* ${track.preview_url || 'Not available'}\n`;
      bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

      // Search for a video on YouTube
      const videoUrl = await searchYouTube(track.name + ' ' + track.artists[0].name);
      if (videoUrl) {
        bot.sendMessage(chatId, `*Video Clip:* [Watch here](${videoUrl})`, { parse_mode: 'Markdown' });
      } else {
        bot.sendMessage(chatId, 'Sorry, no video clip found.');
      }
    } else {
      bot.sendMessage(chatId, 'Sorry, no music found.');
    }
  } catch (error) {
    console.error('An error occurred:', error);
    bot.sendMessage(chatId, 'An error occurred while searching. Please try again.');
  }
});

// Default message when the bot starts
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Welcome! Type the name of a song to search for it and find its video clip.');
});
