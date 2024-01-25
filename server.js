const express = require('express');
const mongoose = require('mongoose')
const shortUrl = require('./models/shortUrl');
const createHttpError = require('http-errors')
const app = express();

mongoose.connect('mongodb://localhost/urlShortener', {
  useNewUrlParser: true, useUnifiedTopology: true
})
.then(()=>console.log('mongoose connected'))
.catch((error)=>console.log('Error Connecting...'))

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }))

app.get('/', async(req, res) => {
  const shortUrls = await shortUrl.find()
  res.render('index', { shortUrls: shortUrls });
});

app.post('/shortUrl',async(req,res,next)=>{
  try{
    const {fullUrl} = req.body
    
    if(!fullUrl){
      throw createHttpError.BadRequest('Provide a valid url')
    }
    const urlExist = await shortUrl.findOne({ full: fullUrl });
    if(urlExist){
      res.render('index',{short_url: `http://localhost:5000/${urlExist.short}`})
      return
    }
    const response_url= await shortUrl.create({ full: fullUrl })
    const result = await response_url.save()
    
    res.render('index',{short_url: `http://localhost:5000/${result.short}`})
  }catch (error){
    next(error)
  }
})

app.get('/:shortUrl', async (req, res) => {
  const url = await shortUrl.findOne({ short: req.params.shortUrl })
  if (url == null) return res.sendStatus(404)

  url.clicks++
  url.save()

  res.redirect(url.full)
})

app.listen(process.env.PORT || 5000, () => {
  console.log('Servidor escuchando en el puerto 5000');
});