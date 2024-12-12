// import { hash } from 'bcrypt'
import bcrypt from 'bcryptjs'

async function main() {
   const hash = await bcrypt.hash('mon mot de passe à la noix', 3)
   console.log('hash', hash)
   const ok1 = await bcrypt.compare('kjlkjl', hash)
   const ok2 = await bcrypt.compare('mon mot de passe à la noix', hash)
   console.log(ok1, ok2)
}

main()
