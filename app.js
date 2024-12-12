import express from 'express'
import { PrismaClient } from "@prisma/client"
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import cookieParser from 'cookie-parser'


const prisma = new PrismaClient()
const app = express()
app.set('view engine', 'ejs')


///////////////////////////    MIDDLEWARES     /////////////////////////////

app.use('/assets', express.static('./assets'))

app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.get('/login', (req, res) => {
   res.render('login', {
      errorMessage: "",
   })
})

app.get('/register', (req, res) => {
   res.render('register', {
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
         const uuid = uuidv4()
         res.cookie('sessionId', uuid, {
            httpOnly: true,
            maxAge: 60*1000,
         })
         .redirect('/visits')
      } else {
         res.render('login', {
            errorMessage: `email ou mot de passe incorrects`,
         })
      }
   } else {
      res.render('login', {
         errorMessage: `email ou mot de passe incorrects`,
      })
   }
})

app.post('/create_account', async (req, res) => {
   const { email, password, password2 } = req.body
   if (password === password2) {
      const existingUser = await prisma.user.findUnique({
         where: { email }
      })
      if (existingUser) {
         res.render('register', {
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
         res.redirect('/login')
         }
   } else {
      res.render('register', {
         errorMessage: "Les deux mots de passe sont différents",
      })
   }

})

/////////////      PROTECT ROUTES      /////////////

app.use('/', (req, res, next) => {
   if (req.cookies.sessionId) {
      next()
   } else {
      res.render('login', {
         errorMessage: "La session a expiré, veuillez vous reconnecter",
      })
   }
})


app.get('/visits', (req, res) => {
   res.render('visits')
})

////////////////////////////////////////////////////////////////////////////

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
   console.log(`Server listening on port http://localhost:${PORT}`)
})
