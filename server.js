const express = require('express');
const mongoose = require('mongoose')
const shortUrl = require('./models/shortUrl');
const createHttpError = require('http-errors')
const path = require('path');
require('dotenv').config();
const app = express();

mongoose.connect(process.env.MONGODB_URI)
.then(()=>console.log('mongoose connected'))
.catch((error)=>console.log('Error Connecting...'+error))

app.use(express.static(path.join(__dirname,'public')))
app.use(express.json())
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }))

app.get('/', async(req, res) => {
  const shortUrls = await shortUrl.find()
  res.render('index', { shortUrls: shortUrls });
});

function isURL(cadena) {
  const expression = /^(ftp|http|https):\/\/[^ "]+$/;
  return expression.test(cadena);
}

app.post('/',async(req,res,next)=>{
  try{
    const {fullUrl} = req.body
    if(!isURL(fullUrl)){
      throw createHttpError.BadRequest('Provide a valid url')
    }
    const urlExist = await shortUrl.findOne({ full: fullUrl });
    if(urlExist){
      res.render('urlcreated',{short_url: `${req.headers.host}/${urlExist.short}`,full_url:fullUrl})
      return
    }
    const response_url= await shortUrl.create({ full: fullUrl })
    const result = await response_url.save()
    
    res.render('urlcreated',{short_url: `${req.headers.host}/${result.short}`,full_url:fullUrl})
  }catch (error){
    next(error)
  }
})

app.get('/:shortId', async (req, res, next) => {
  try {
    const {shortId}= req.params
    const url = await shortUrl.findOne({ short: shortId })
    if(!url){
      throw createHttpError.NotFound('This Url does not exist.')
    }
    url.clicks++
    url.save()
    res.redirect(url.full)
  } catch (error) {
    next(error)
  }
})

app.use((next)=>{
  next(createHttpError.NotFound())
})

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render('index', { error: err.message });
});

app.listen(process.env.PORT || 5000, () => {
  console.log('Server on port 5000');
});