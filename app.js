// copy (key, values) from .env to process.env
import 'dotenv/config'

import express from 'express'
import cookieParser from 'cookie-parser'


import useRegister from './middlewares/register.mjs'
import useLogin from './middlewares/login.mjs'


const app = express()
app.set('view engine', 'ejs')



///////////////////////////    MIDDLEWARES     /////////////////////////////

app.use('/assets', express.static('./assets'))

app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

useRegister(app)
useLogin(app)


/////////////      PROTECTED ROUTES      /////////////

app.use('/', (req, res, next) => {
   if (req.cookies.sessionId) {
      next()
   } else {
      res.render('login/login', {
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
