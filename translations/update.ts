import fs from 'fs'
import axios from 'axios'

export async function updateTranslations (): Promise<{
  success: true
} | {
  success: false
  error: string
}> {
  try {
    const urls = {
      en: 'https://raw.githubusercontent.com/JPSAUD501/MelodyScout/Crowdin/en.json'
    }

    for (const lang in urls) {
      const response = await axios.get(urls[lang]).catch((error) => {
        return new Error(error)
      })
      if (response instanceof Error) {
        return {
          success: false,
          error: `Error on updating translations: ${response.message}`
        }
      }
      const json = response.data as Record<string, string>
      const textArray: string[] = []
      textArray.push(`export const ${lang} = {`)
      for (const key in json) {
        let value: string = json[key]
        value = value.replaceAll('\n', '\\n')
        switch (true) {
          case (value.includes("'") && value.includes('"')):
            value = `'${value.replaceAll("'", "\\'")}'`
            break
          case (value.includes("'")):
            value = `"${value}"`
            break
          case (value.includes('"')):
            value = `'${value}'`
            break
          default:
            value = `'${value}'`
        }
        let finalString = `  ${key}: ${value}`
        if (Object.keys(json).indexOf(key) < Object.keys(json).length - 1) {
          finalString += ','
        }
        textArray.push(`${finalString}`)
      }
      textArray.push('}')
      textArray.push('')
      const text = textArray.join('\n')
      if (!fs.existsSync('./translations/languages')) {
        fs.mkdirSync('./translations/languages')
      }
      if (fs.existsSync(`./translations/languages/${lang}.ts`)) {
        const content = fs.readFileSync(`./translations/languages/${lang}.ts`).toString()
        if (content === text) {
          console.log(`File ${lang}.ts is already up to date!`)
          continue
        }
      }
      fs.writeFileSync(`./translations/languages/${lang}.ts`, text)
      console.log(`File ${lang}.ts was updated!`)
    }
  } catch (error) {
    return {
      success: false,
      error: `Error on updating translations: ${String(error)}`
    }
  }
  return {
    success: true
  }
}
