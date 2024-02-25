const name = {
  value: "name",
  display: "Song Name"
}

const artists = {
  value: "artists",
  display: "Artists"
}

const genres = {
  value: "genres",
  display: "Genres"
}

const datePublished = {
  value: "date_published",
  display: "Date Published"
}

const link = {
  value: "link",
  display: "Link to Review"
}

const site = {
  value: "site",
  display: "Site"
}

const spotifyTrackId = {
  value: "spotify_track_id",
  display: "Spotify Track ID"
}

const trackPreviewUrl = {
  value: "track_preview_url",
  display: ""
}

const album = {
  value: "album",
  display: "Album"
}

export const tracksTableHeaders = [
  name,
  artists,
  genres,
  datePublished,
  link,
  site,
  spotifyTrackId,
  trackPreviewUrl,
];
  
export const addTrackIdTableHeaders = [
  name,
  artists,
  genres,
  datePublished,
  link,
  site,
  spotifyTrackId,
  {
    value: "",
    display: ""
  },
]

export const searchResultsTableHeaders = [
  name,
  album,
  artists,,
  link,
  spotifyTrackId,
]
