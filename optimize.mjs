import { ImagePool } from "@squoosh/lib"
import { cpus } from "os"
import { readdirSync, readFileSync } from "fs"
import { writeFile } from "fs/promises"
const IMAGE_DIRs = [
  "source"
]
const OUTPUT_DIR = "optimized/"

const jpgEncodeOptions = {
  mozjpeg: {
    quality: 40
  },
}
const pngEncodeOptions = {
  oxipng: {
    effort: 2,
  },
}

const optimize = async (imagedir) => {

  const imagePool = new ImagePool(cpus().length)
  const imageFileList = readdirSync(imagedir).filter((file) => {
    const regex = /\.(jpe?g|png)$/i
    return regex.test(file)
  })

  const imagePoolList = imageFileList.map((fileName) => {
    const imageFile = readFileSync(`${imagedir}/${fileName}`)
    const image = imagePool.ingestImage(imageFile)
    return { name: fileName, image }
  })

  await Promise.all(
    imagePoolList.map(async (item) => {
      console.log(item.name)
      const { image } = item
      if (/\.(jpe?g)$/i.test(item.name)) {
        await image.encode(jpgEncodeOptions)
      }
      if (/\.(png)$/i.test(item.name)) {
        await image.encode(pngEncodeOptions)
      }
    })
  )

  for (const item of imagePoolList) {
    const {
      name,
      image: { encodedWith },
    } = item

    let data
    if (encodedWith.mozjpeg) {
      data = await encodedWith.mozjpeg
    }
    if (encodedWith.oxipng) {
      data = await encodedWith.oxipng
    }
    //await writeFile(`${OUTPUT_DIR}${imagedir}/${name}`, data.binary)
    await writeFile(`${OUTPUT_DIR}/${name}`, data.binary)
  }

  await imagePool.close()
}

for(const imagedir of IMAGE_DIRs) {
  console.log(imagedir)
  await optimize(imagedir)
}
