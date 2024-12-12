import "dotenv/config";

const API_KEY = process.env.LASTFM_APIKEY;

export const getRecentlyPlayedTrack = async () => {
  try {
    const response = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=TeddyToddy&api_key=${API_KEY}&format=json`
    );

    const data = await response.json();

    const info = data.recenttracks.track[0];
    const artist = info.artist["#text"];
    const name = info.name;
    const image = info.image[1]["#text"];
    const url = info.url;

    return { artist, name, image, url };
  } catch (err) {
    throw new Error("A system error occurred");
  }
};
