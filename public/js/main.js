(() => {

  const Chart = require('./Chart.min.js');

  function get(url, args) { //Async function to use AJAX
/* params:
 * url (str) [,
 * args (obj) query parameters
 * ]
 * return Promise (obj)
 */

      return new Promise((resolve, reject) => {
        var req;
      if(window.XMLHttpRequest)
         req = new XMLHttpRequest();
      else if(window.ActiveXObject) //For IE6 and less
          req = new ActiveXObject("Microsoft.XMLHTTP")
      else
          reject("Ajax not supported");
        var uri = url;

        if(args != null && args != undefined) {
          uri += '?';
          for(let key in args) {
            uri += `${key}=${args[key]}&`; //Parse options to URI
          }
          uri = uri.substr(0, uri.length - 1);
        }

        req.open('GET', uri);
        req.onreadystatechange = () => {
          if(req.readyState === XMLHttpRequest.DONE || req.readyState == 4) {
            if(req.status == 200)
              resolve(req.response);
          }
        };
        req.onerror = () => reject(this.response);
        req.send();
      });
  }

  /* Create Charts
   *  ctx (DOM)
   *  args (obj) {
   *    title (str)
   *    headers (Arr) labels
   *    stats (Arr)
   *    return obj
   */

  function barsChart(ctx, args) {

   return new Chart(ctx, {
        type: 'bar',
        data: {
          labels: args.headers,
          datasets: [{
            backgroundColor: ['rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)'],
             borderColor: [
                'rgba(255,99,132,1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1,
            data: args.stats
          }]
        },
        options: {
          title: {
            display: true,
            text: args.title
          }
        }
      });
  }

  /* Append stats into comparison table
   * id (str) row id
   * name (str) batsman name
   * data (Arr) in order to table headers
   */
  function insertTable(id, name, data) {
    data.unshift(name);
      document.querySelector(`#${id}`).innerHTML = data.map((e) => `<td>${e}</td>`).join('');
  }

  get('/st') //Get sachin data
    .then((res) => {
      this.firstGraph = document.querySelector('#sachinStats').querySelector('canvas');
      const dataS = JSON.parse(res);
      const sLabels = ['batting_innings', 'batting_score', 'catches', 'runs_conceded', 'wickets'];
      const stats = sLabels.map((label, i) => { //convert objects to arrays
        var highestScore = 0;
        return dataS.map((obj) => obj[label]).reduce((a,b)=>{
          if(i === 1)
            return Number(b) > highestScore ? Number(b) : highestScore;
          a = (/[-_]/g.test(a)) ? 0 : parseInt(a); // and strings to numbers
          b = (/[-_]/g.test(b)) ? 0 : parseInt(b);
          return a + b;
        });
      });
      barsChart(this.firstGraph, {
        title: 'Stats until 2012',
        headers: sLabels.map((l) => l.replace(/[-_]/g, ' ')),
        stats
      });
      const tableStats = stats.filter((e, i) => i === 0 || i === 3);

      insertTable('st', 'Sachin Tendulkar (INDIA)', tableStats);

      this.secondGraph = document.querySelector('#playerStats').querySelector('canvas');

      get('/fetch', {url: 'http://stats.espncricinfo.com/ci/engine/records/batting/most_runs_career.html?class=1;id=2016;type=year', selector: 'table:first-of-type'}) //Get batsmen data
    .then((res) => {

      // Parse object values into arrays
      const dataC = JSON.parse(res),
            cLabels = ['Inns', 'Runs', 'HS', 'Ave'],
            playerStats = dataC.data
           .map((obj) => cLabels.map((label) => parseInt(obj[label])));

      dataC.data.forEach((player) => {
        let li = document.createElement('li');
        li.innerHTML = player.Player;
        li.addEventListener('click', changePlayer.bind(this, null, li.innerHTML));
        document.querySelector('aside').querySelector('ul').appendChild(li);
      });

      changePlayer(0); //initialize player chart

      /* Change the bastman chart and comparison
       *  i (int)
       *  playerName (string)
       *  Any of these two could be used
       */
      function changePlayer(i, playerName) {
        if(!i || i == null || i == undefined)
          i = dataC.data.findIndex((e) => e.Player === playerName);
          barsChart(this.secondGraph, {
            title: dataC.data[i].Player,
            headers: cLabels.map((l) => l.replace(/[-_]/g, ' ')),
            stats: playerStats[i]
          });
          let tableStats = playerStats[i].slice(2);
          insertTable('pl', dataC.data[i].Player, tableStats);
      }
    })
    .catch((err) => { console.log(err);this.secondGraph.innerHTML = "<p>Sorry... We cannot get the data</p>"; });
    })
    .catch((err) => { console.log(err);this.firstGraph.innerHTML = "<p>Sorry... We cannot get the data</p>";});

})();
