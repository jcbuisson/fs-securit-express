import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import { PrismaClient } from "@prisma/client"

import { sendMyMail } from '#root/lib/mail.mjs'
import { generateRandomCode } from '#root/lib/utilities.mjs'


export default function (app) {

   const prisma = new PrismaClient()

   const email2Code = {}

   app.get('/login', (req, res) => {
      res.render('login/login', {
         errorMessage: "",
      })
   })
   
   app.post('/check_credentials', async (req, res) => {
      const { email, password } = req.body
      const user = await prisma.user.findUnique({
         where: { email }
      })
      if (user) {
         const isOK = await bcrypt.compare(password, user.password)
         if (isOK) {
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
   
            res.render('login/login_verify', {
               email,
               errorMessage: '',
            })
         } else {
            res.render('login/login', {
               errorMessage: `email ou mot de passe incorrects`,
            })
         }
      } else {
         res.render('login/login', {
            errorMessage: `email ou mot de passe incorrects`,
         })
      }
   })
   
   app.post('/verify_login_code', async (req, res) => {
      const { email, code } = req.body
      if (req.cookies.codeExpiration) {
         if (email2Code[email] === code) {
            // confirmation code verified: remove entry in `email2Code`
            delete email2Code[email]
            // create session cookie
            const uuid = uuidv4()
            res.cookie('sessionId', uuid, {
               httpOnly: true,
               maxAge: 60*1000,
            })
            res.redirect("/visits")
         } else {
            res.render('login/login_verify', {
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


      app.post('/login_set_password', async (req, res) => {
         const { email, password, password2 } = req.body
         if (password === password2) {
            const existingUser = await prisma.user.findUnique({
               where: { email }
            })
            if (existingUser) {
               res.render('register/register', {
                  errorMessage: `Un utilisateur ayant cet email existe déjà : ${email}`,
               })
            } else {
               const passwordHash = await bcrypt.hash(password, 3)
               const createdUser = await prisma.user.create({
                  data: {
                     email,
                     password: passwordHash,
                     role: 'inspector',
                  }
               })
   
               // cookie for expiration of confirmation code
               res.cookie('codeExpiration', 'dummy', { maxAge: 60*1000 })
   
               res.render('register/register_verify', {
                  email,
                  errorMessage: '',
               })
            }
         } else {
            res.render('register/register', {
               errorMessage: "Les deux mots de passe sont différents",
            })
         }
   
      })
   
}
