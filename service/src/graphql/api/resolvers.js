require('dotenv').config()

// Imports the Google Cloud client library
const { SpeechClient } = require('@google-cloud/speech')
const fs = require('fs')
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')
const url = require('url')
const path = require('path')
const hash = require('object-hash')
const ffmpegStatic = require('ffmpeg-static')
const ffmpeg = require('fluent-ffmpeg')
ffmpeg.setFfmpegPath(ffmpegStatic.path)

const WORKING_DIR = process.env.WORKING_DIR || './'

// Creates a client
const client = new SpeechClient({
  projectId: 'maana-df-test'
})

const recognize = async ({ audio, sourceLanguageTag }) => {
  try {
    mkdirp.sync(WORKING_DIR)

    const sourceUrl = url.parse(
      audio.file.url ? audio.file.url.id : audio.file.id
    ).href
    const localFile = path.resolve(WORKING_DIR, hash(sourceUrl))

    return new Promise((resolve, reject) => {
      ffmpeg(sourceUrl)
        .outputOptions([
          '-f s16le',
          '-acodec pcm_s16le',
          '-vn',
          '-ac 1',
          '-ar 16k',
          '-map_metadata -1'
        ])
        .save(localFile)
        .on('error', err => {
          reject(err)
        })
        .on('end', () => {
          // Reads a local audio file and converts it to base64
          const file = fs.readFileSync(localFile)
          const audioBytes = file.toString('base64')

          // Cleanup
          rimraf(localFile, () => {})

          // The audio file's encoding, sample rate in hertz, and BCP-47 language code
          const audio = {
            content: audioBytes
          }
          const config = {
            encoding: audio.encoding ? audio.encode.id : 'LINEAR16',
            sampleRateHertz: audio.sampleRate ? audio.sampleRate.id : 16000,
            languageCode: sourceLanguageTag ? sourceLanguageTag.id : 'en-US'
          }
          const request = {
            audio: audio,
            config: config
          }

          // Detects speech in the audio file
          client
            .recognize(request)
            .then(data => {
              // console.log('Raw Response:', JSON.stringify(data))
              const result = data[0].results[0].alternatives[0]
              // console.log('result', result)
              resolve({
                id: hash(sourceUrl),
                text: result.transcript,
                confidence: result.confidence
              })
            })
            .catch(err => {
              // console.error('ERROR:', err)
              resolve(err)
            })
        })
    })
  } catch (e) {
    // console.log('Exception: ', e)
    throw e
  }
}

export const resolver = {
  Query: {
    info: async () => {
      return {
        id: 'maana-google-ai-speech-to-text',
        name: 'maana-google-ai-speech-to-text',
        description:
          'Maana Q Knowledge Service wrapper for Google Cloud Speech-to-Text service'
      }
    },
    getTranscriptionConfidence: async (_, { transcription }) =>
      transcription.confidence,
    getTranscriptionText: async (_, { transcription }) => transcription.text,
    makeTranscription: async (_, { id, text, confidence }) => ({
      id: id || hash(`${text}#${confidence}`),
      text,
      confidence
    }),
    recognize: async (_, args) => recognize(args)
  }
}
