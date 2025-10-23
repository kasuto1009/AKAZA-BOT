// libs/youtube.js (VERSIÓN ACTUALIZADA A ES MODULES Y MEJORADA)

import ytdl from 'ytdl-core';
import yts from 'yt-search';
import axios from 'axios';
import NodeID3 from 'node-id3';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { randomBytes } from 'crypto';
import { fileURLToPath } from 'url';

// --- CONFIGURACIÓN DE __dirname para ES Modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carpeta temporal para guardar los archivos descargados
const tempFolder = path.join(__dirname, "../tmp/");
if (!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder);

// Expresión regular para validar URLs de YouTube
const ytIdRegex = /(?:youtube\.com\/\S*(?:(?:\/e(?:mbed))?\/|watch\?(?:\S*?&?v=))|youtu\.be\/)([a-zA-Z0-9_-]{6,11})/

class YT {
    /**
     * Checks if it is yt link
     * @param {string|URL} url youtube url
     * @returns Returns true if the given YouTube URL.
     */
    static isYTUrl = (url) => {
        return ytIdRegex.test(url)
    }

    /**
     * VideoID from url
     * @param {string|URL} url to get videoID
     * @returns 
     */
    static getVideoID = (url) => {
        if (!this.isYTUrl(url)) throw new Error('is not YouTube URL')
        return ytIdRegex.exec(url)[1]
    }

    /**
     * @typedef {Object} IMetadata
     * @property {string} Title track title
     * @property {string} Artist track Artist
     * @property {string} Image track thumbnail url
     * @property {string} Album track album
     * @property {string} Year track release date
     */

    /**
     * Write Track Tag Metadata
     * @param {string} filePath 
     * @param {IMetadata} Metadata 
     */
    static WriteTags = async (filePath, Metadata) => {
        // Mejoramos la descarga del buffer de imagen para la etiqueta
        const imageBuffer = (await axios.get(Metadata.Image, { responseType: 'arraybuffer' })).data;

        NodeID3.write(
            {
                title: Metadata.Title,
                artist: Metadata.Artist,
                originalArtist: Metadata.Artist,
                image: {
                    mime: 'jpeg',
                    type: {
                        id: 3,
                        name: 'front cover',
                    },
                    imageBuffer: imageBuffer,
                    description: `Cover of ${Metadata.Title}`,
                },
                album: Metadata.Album,
                year: Metadata.Year || ''
            },
            filePath
        );
    }

    /**
     * @typedef {Object} TrackSearchResult
     * @property {boolean} isYtMusic is from YT Music search?
     * @property {string} title music title
     * @property {string} artist music artist
     * @property {string} id YouTube ID
     * @property {string} url YouTube URL
     * @property {string} album music album
     * @property {Object} duration music duration {seconds, label}
     * @property {string} image Cover Art
     */

    /**
     * search track with details
     * @param {string} query 
     * @returns {Promise<TrackSearchResult[]>}
     */
    static searchTrack = (query) => {
        return new Promise(async (resolve, reject) => {
            try {
                // Aquí se usaba ytM.searchMusics, que no está importado.
                // Usaremos directamente yts para una búsqueda general.
                let search = await yts.search({ query, hl: 'id', gl: 'ID' });
                let ytVideos = search.videos.slice(0, 5); // Tomamos los primeros 5 resultados
                
                let result = [];
                for (let i = 0; i < ytVideos.length; i++) {
                    result.push({
                        isYtMusic: false, // Asumimos false ya que es yts.search
                        title: ytVideos[i].title,
                        artist: ytVideos[i].author.name,
                        id: ytVideos[i].videoId,
                        url: ytVideos[i].url,
                        album: '', // No disponible directamente en yts
                        duration: {
                            seconds: ytVideos[i].seconds,
                            label: ytVideos[i].timestamp
                        },
                        image: ytVideos[i].thumbnail
                    })
                }
                resolve(result)
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * @typedef {Object} MusicResult
     * @property {TrackSearchResult} meta music meta
     * @property {string} path file path
     * @property {number} size file size in bytes
     */

    /**
     * Download music with full tag metadata
     * @param {string|TrackSearchResult[]} query title of track want to download
     * @returns {Promise<MusicResult>} filepath of the result
     */
    static downloadMusic = async (query) => {
        try {
            const getTrack = Array.isArray(query) ? query : await this.searchTrack(query);
            const search = getTrack[0];
            const videoInfo = await ytdl.getInfo('https://www.youtube.com/watch?v=' + search.id, { lang: 'id' });
            
            let songPath = path.join(tempFolder, `${randomBytes(3).toString('hex')}.mp3`);
            let stream = ytdl(search.id, { filter: 'audioonly', quality: 140 });

            // Pipe stream to file
            const writeStream = fs.createWriteStream(songPath);
            stream.pipe(writeStream);

            await new Promise((resolve, reject) => {
                writeStream.on('finish', resolve);
                writeStream.on('error', reject);
                stream.on('error', reject); // Catch errors from ytdl stream
            });

            await this.WriteTags(songPath, { 
                Title: search.title, 
                Artist: search.artist, 
                Image: search.image, 
                Album: search.album, 
                Year: videoInfo.videoDetails.publishDate.split('-')[0] 
            });
            
            return {
                meta: search,
                path: songPath,
                size: fs.statSync(songPath).size
            }
        } catch (error) {
            throw new Error(error)
        }
    }

    /**
     * get downloadable video urls
     * @param {string|URL} query videoID or YouTube URL
     * @param {string} quality 
     * @returns
     */
    static mp4 = async (query, quality = 134) => {
        try {
            if (!query) throw new Error('Video ID or YouTube Url is required')
            const videoId = this.isYTUrl(query) ? this.getVideoID(query) : query
            const videoInfo = await ytdl.getInfo('https://www.youtube.com/watch?v=' + videoId, { lang: 'id' });
            const format = ytdl.chooseFormat(videoInfo.formats, { format: quality, filter: 'videoandaudio' })
            return {
                title: videoInfo.videoDetails.title,
                thumb: videoInfo.videoDetails.thumbnails.slice(-1)[0],
                date: videoInfo.videoDetails.publishDate,
                duration: videoInfo.videoDetails.lengthSeconds,
                channel: videoInfo.videoDetails.ownerChannelName,
                quality: format.qualityLabel,
                contentLength: format.contentLength,
                description: videoInfo.videoDetails.description,
                videoUrl: format.url
            }
        } catch (error) {
            throw error
        }
    }

    /**
     * Download YouTube to mp3
     * @param {string|URL} url YouTube link want to download to mp3
     * @param {IMetadata} metadata track metadata
     * @param {boolean} autoWriteTags if set true, it will auto write tags meta following the YouTube info
     * @returns 
     */
    static mp3 = async (url, metadata = {}, autoWriteTags = false) => {
        try {
            if (!url) throw new Error('Video ID or YouTube Url is required')
            url = this.isYTUrl(url) ? 'https://www.youtube.com/watch?v=' + this.getVideoID(url) : url
            const { videoDetails } = await ytdl.getInfo(url, { lang: 'id' });
            let stream = ytdl(url, { filter: 'audioonly', quality: 140 });
            let songPath = path.join(tempFolder, `${randomBytes(3).toString('hex')}.mp3`);

            // Pipe stream to file
            const writeStream = fs.createWriteStream(songPath);
            stream.pipe(writeStream);

            await new Promise((resolve, reject) => {
                writeStream.on('finish', resolve);
                writeStream.on('error', reject);
                stream.on('error', reject); // Catch errors from ytdl stream
            });

            if (Object.keys(metadata).length !== 0) {
                await this.WriteTags(songPath, metadata)
            }
            if (autoWriteTags) {
                await this.WriteTags(songPath, { Title: videoDetails.title, Artist: videoDetails.author.name, Image: videoDetails.thumbnails.slice(-1)[0].url, Album: videoDetails.author.name, Year: videoDetails.publishDate.split('-')[0] })
            }
            return {
                meta: {
                    title: videoDetails.title,
                    channel: videoDetails.author.name,
                    seconds: videoDetails.lengthSeconds,
                    image: videoDetails.thumbnails.slice(-1)[0].url
                },
                path: songPath,
                size: fs.statSync(songPath).size
            }
        } catch (error) {
            throw error
        }
    }
}

export default YT;