const request = require('request'),
      cheerio = require('cheerio'),
      express = require('express');



const fs = require('fs'),
      d3 = require('d3'),
      path = require('path');

function csvData(filename, callback) {
  fs.readFile(path.join(__dirname, filename), 'utf-8', (err, data) => {
    if(err)
      return err;
    callback(null, d3.csvParse(data));
  })
}

const app = express();
app.use(express.static(`${__dirname}/public`));

app.route('/').get((req, res) => {
    res.sendFile('/index.html');
});


function scraps(url, selector='html') {
    console.log(url);
    return new Promise((resolve, reject) => {
        request(url.replace('%22', '').replace('"', '').replace("\"", 
''), 
function 
(error, 
response, data) {
            if(error)
                reject(error.message);
            if(!data || data == undefined)
                reject("Nothing received");

            const $ = cheerio.load(data, { ignoreWhitespace: true });
            if(selector.match('table')) {
                const title = $(selector).find('caption').text();
                const headers = $(selector).children('thead').children('tr').children('th').map((_, el) => {
                    return $(el).text();
                }).get();
                const data = [];
                $(selector).find('tbody').children('tr').each((act, el) => {
                    data[act] = {};
                    $(el).children('td').each((i, e) => {
                        var h = headers[i];
                        var stat = new Object();
                        stat[headers[i]] = $(e).text();
                        Object.assign(data[act], stat);
                    });
                });
                resolve({
                    title,
                    headers,
                    data
                });
            }
            resolve($(selector).text());
        });
    });
}

app.get('/st', (req, res) => {
    csvData(`data/sachin.csv`, (e, data) => {
        if(e)
            res.status(500).end({ message: e.message });
        res.status(200).send(data);
        res.end();
    });
});

app.get('/fetch', (req, res) => {
    if(req.query.url === undefined) {
        res.status(403).end(JSON.stringify({message: 'url must be passed'}));
    }
    const { url, selector } = req.query;
    console.log(`Incoming fetch 
request: ${JSON.stringify(req.query)}\n`);
    scraps(url, selector)
    .then((html) => { res.status(200).send(html); res.end(); })
    .catch((e) => res.end(JSON.stringify({ message: e })));
});

app.listen(process.env.PORT, ()=> console.log('http://localhost:5000'));
