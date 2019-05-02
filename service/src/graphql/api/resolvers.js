require('dotenv').config()

const { Translate } = require('@google-cloud/translate')
const translator = new Translate({
  projectId: 'maana-df-test'
})

const translate = async (texts, sourceLang, targetLang) => {
  try {
    const res = await translator.translate(texts, {
      from: sourceLang,
      to: targetLang
    })
    return res
  } catch (e) {
    console.log('Exception: ', e)
    throw e
  }
}

export const resolver = {
  Query: {
    info: async () => {
      return {
        id: 'maana-google-ai-translate',
        name: 'maana-google-ai-translate',
        description:
          'Maana Q Knowledge Service wrapper for Google Cloud Translation'
      }
    },
    translateOne: async (_, { text, targetLanguageTag }) => {
      const res = await translate(text, undefined, targetLanguageTag.id)
      return {
        id: 0,
        text: res[0],
        languageTag: targetLanguageTag
      }
    },
    translateOneLocalized: async (_, { localizedText, targetLanguageTag }) => {
      const res = await translate(
        localizedText.text,
        localizedText.languageTag.id,
        targetLanguageTag.id
      )
      return {
        id: 0,
        text: res[0],
        languageTag: targetLanguageTag
      }
    },

    translateMultiple: async (_, { texts, targetLanguageTag }) => {
      const res = await translate(texts, undefined, targetLanguageTag.id)
      return res[0].map((x, i) => ({
        id: i.toString(),
        text: x,
        languageTag: targetLanguageTag
      }))
    },
    translateMultipleLocalized: async (
      _,
      { localizedTexts, targetLanguageTag }
    ) => {
      // NOTE: this assumes the collection of localizedTexts to translate are all the same language tag!
      const res = await translate(
        localizedTexts.map(x => x.text),
        localizedTexts[0].languageTag.id,
        targetLanguageTag.id
      )
      return res[0].map((x, i) => ({
        id: i.toString(),
        text: x,
        languageTag: targetLanguageTag
      }))
    }
  }
}
