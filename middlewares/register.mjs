
import bcrypt from 'bcryptjs'
import { PrismaClient } from "@prisma/client"

import { sendMyMail } from '#root/lib/mail.mjs'
import { generateRandomCode } from '#root/lib/utilities.mjs'

const prisma = new PrismaClient()


export default function (app) {

   const email2Code = {}

   app.get('/register', (req, res) => {
      res.render('register/register', {
         errorMessage: "",
      })
   })

   app.post('/verify_register_code', async (req, res) => {
      const { email, code } = req.body
      if (req.cookies.codeExpiration) {
         if (email2Code[email] === code) {
            // confirmation code verified: remove entry in `email2Code`
            delete email2Code[email]
            res.render('register/register_password', {
               email,
               errorMessage: ``,
            })
         } else {
            res.render('register/register_verify', {
               email,
               errorMessage: `Code de vérification incorrect, réessayez`,
            })
         }
      } else {
         // no 'codeExpiration' cookie : confirmation code has expired
         res.render('login/login', {
            email,
            errorMessage: `Le code de vérification a expiré`,
         })
      }
   })

   app.post('/register', async (req, res) => {
      const { email } = req.body
      const code = generateRandomCode(5, "0123456789")
      email2Code[email] = code
      await sendMyMail({
         from: 'buisson@enseeiht.fr',
         to: email,
         subject: "Connexion à Securit",
         text: `Voici votre code de confirmation : ${code}`,
      })

      // cookie for expiration of confirmation code
      res.cookie('codeExpiration', 'dummy', { maxAge: 60*1000 })

      res.render('register/register_verify', {
         email,
         errorMessage: '',
      })
   })

   app.post('/register_set_password', async (req, res) => {
      const { email, password, password2 } = req.body
      if (password === password2) {
         const existingUser = await prisma.user.findUnique({
            where: { email }
         })
         if (!existingUser) {
            const passwordHash = await bcrypt.hash(password, 3)
            const createdUser = await prisma.user.create({
               data: {
                  email,
                  password: passwordHash,
                  role: 'inspector',
               }
            })
         }
         // whether user with this email already exists or not, redirect to login page
         res.redirect('/login')
      } else {
         res.render('register/register', {
            errorMessage: "Les deux mots de passe sont différents",
         })
      }

   })
}
