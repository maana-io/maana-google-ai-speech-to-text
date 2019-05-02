const { GraphQLServer } = require('graphql-yoga')
const fs = require('fs')

// Imports the Google Cloud client library
const speech = require('@google-cloud/speech')

// Creates a client
const speechClient = new speech.SpeechClient()

const ENCODING = 'LINEAR16'
const SAMPLE_RATE_HZ = 16000
const LANGUAGE_CODE = 'en-US'

function speechConfig() {
  return {
    encoding: ENCODING,
    sampleRateHertz: SAMPLE_RATE_HZ,
    languageCode: LANGUAGE_CODE
  }
}

function getResultTranscript(result) {
  const transcript = result.results
    .map(res => res.alternatives && res.alternatives.map(alt => alt.transcript))
    .reduce((res, trans) => res.concat(trans), [])
    .join('\n')

  process.stdout.write(
    !!transcript
      ? `Transcription: ${transcript}\n`
      : `\n\nReached transcription time limit, press Ctrl+C\n`
  )

  return transcript || ''
}

const resolvers = {
  Query: {
    async audioToText(parent, { audioClip }) {
      const { url, start, end } = audioClip
      const result = await speechClient.recognize({
        config: speechConfig(),
        audio: {
          uri: url
        }
      })

      const transcript = getResultTranscript(
        Array.isArray(result) ? result[0] : result
      )

      return {
        id: '0',
        text: transcript,
        start,
        end
      }
    }
  }
}

const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers,
  context: req => ({
    ...req
  })
})

server.start(() => console.log('Server is running on http://localhost:4000'))
