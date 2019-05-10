require('dotenv').config()

// Imports the Google Cloud client library
const { SpeechClient } = require('@google-cloud/speech')
const fs = require('fs')
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')
const url = require('url')
const path = require('path')
const request = require('request')
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
    const sourceUrl = url.parse(audio.id).href
    const workingDir = path.resolve(WORKING_DIR, hash(sourceUrl))

    mkdirp.sync(workingDir)

    const localFile = path.resolve(workingDir, 'input')

    return new Promise((resolve, reject) => {
      request(sourceUrl)
        .pipe(fs.createWriteStream(localFile))
        .on('error', error => reject(error))
        .on('close', () => {
          const cvtFile = path.resolve(workingDir, 'output')
          // console.log('cvt', cvtFile)
          ffmpeg(localFile)
            .outputOptions([
              '-f s16le',
              '-acodec pcm_s16le',
              '-vn',
              '-ac 1',
              '-ar 16k',
              '-map_metadata -1'
            ])
            .on('error', err => {
              reject(err)
            })
            .on('end', () => {
              // Reads a local audio file and converts it to base64
              const file = fs.readFileSync(localFile)
              const audioBytes = file.toString('base64')

              // Cleanup
              rimraf(workingDir, () => {})

              // The audio file's encoding, sample rate in hertz, and BCP-47 language code
              const request = {
                audio: {
                  content: audioBytes
                },
                config: {
                  encoding: audio.encoding ? audio.encode.id : 'LINEAR16',
                  sampleRateHertz: audio.sampleRate
                    ? audio.sampleRate.id
                    : 16000,
                  languageCode: sourceLanguageTag
                    ? sourceLanguageTag.id
                    : 'en-US'
                }
              }

              // Detects speech in the audio file
              client
                .recognize(request)
                .then(data => {
                  const results = data[0].results
                  const text = results
                    .map(x => x.alternatives[0].transcript)
                    .join('')
                  const confidence =
                    results[0] &&
                    results[0].alternatives &&
                    results[0].alternatives[0]
                      ? results[0].alternatives[0].confidence
                      : 0.0
                  resolve({
                    id: audio.id,
                    text,
                    confidence
                  })
                })
                .catch(err => {
                  // console.error('ERROR:', err)
                  resolve(err)
                })
            })
            .save(cvtFile)
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
