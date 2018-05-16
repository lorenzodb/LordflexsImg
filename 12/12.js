var app = angular.module('ApioApplication12', ['apioProperty'])
app.controller('defaultController', ['$scope', 'currentObject', '$timeout', '$mdDialog', '$window', '$http', '$location', 'socket', function ($scope, currentObject, $timeout, $mdDialog, $window, $http, $location, socket) {
  $scope.object = currentObject.get()
  console.log("Sono il defaultController e l'oggetto è: ", $scope.object)

  document.getElementById('ApioApplicationContainer').classList.add('fullscreen')

  // variabile che indica se il motore è in movimento
  $scope.move = 0

  $scope.numTestDone = 0

  // varibili utilizzati per il calcolo del migliore materasso, per la generazione del PDF e per la creazione delle grafiche SVG
  $scope.matrixHumanSvg = {}

  $scope.drawingOk = false

  $scope.sesso = 'uomo'
  $scope.sex = 0
  $scope.altezza = 160
  $scope.personName = ''
  $scope.personSurname = ''
  $scope.personAge = null
  $scope.personEmail = ''
  $scope.personAddr = ''
  $scope.personCity = ''
  $scope.personCell = ''
  $scope.typeTest = 'singolo'
  $scope.stepTypeTest = 0

  $scope.testStep = -3

  $scope.verifiedInfoClients = false
  $scope.verifyInfoClients = function (x) {
    console.log('verifyInfoClients', x)
    var personNameTrarget = document.getElementById('personName')
    var personSurnameTrarget = document.getElementById('personSurname')
    var personAgeTrarget = document.getElementById('personAge')
    // console.log('target is:',e);

    if ($scope.personName.length - 1 > 2 && $scope.personName !== '') {
      personNameTrarget.classList.remove('notverify')
      console.log('verify')
      $scope.verifiedInfoClients = true
    } else {
      personNameTrarget.classList.add('notverify')
      console.log('notverify')
      $scope.verifiedInfoClients = false
    }
    if ($scope.personSurname.length - 1 > 2 && $scope.personSurname !== '') {
      personSurnameTrarget.classList.remove('notverify')
      $scope.verifiedInfoClients = true
    } else {
      $scope.verifiedInfoClients = false
      personSurnameTrarget.classList.add('notverify')
    }
    if ($scope.personAge != null && $scope.personAge.length - 1 >= 1 && $scope.personAge !== '') {
      personAgeTrarget.classList.remove('notverify')
      $scope.verifiedInfoClients = true
    } else {
      $scope.verifiedInfoClients = false
      personAgeTrarget.classList.add('notverify')
    }
  }

  $scope.selectSex = function () {
    if ($scope.sesso === 'uomo') {
      $scope.sesso = 'donna'
      $scope.sex = 1
    } else {
      $scope.sesso = 'uomo'
      $scope.sex = 0
    }
  }
  $scope.listenAlt = function () {
    $scope.altezza = parseInt(document.getElementById('hightSlider').value)
  }

  $scope.lastMatrixRecive = 0

  $scope.imc = 0
  $scope.altezzaPercentuale = $scope.altezza - 100

  $scope.tara = Number($scope.object.properties.tara.replace(',', '.'))
  $scope.tolleranceLeftRight = 205
  $scope.correzzioneMatrixSens = 14
  var tolleranza = 0
  $scope.azzeramentoTara = 0
  $scope.peso = 60

  $scope.peso1 = 0
  $scope.peso2 = 0
  $scope.peso3 = 0
  $scope.peso4 = 0

  $scope.tempPeso = 0
  var myChart = undefined
  var graph = undefined
  var graph2d = undefined
  var graph3d = undefined

  var arrayTemplate = {
    numeroRighe: 14,
    numeroColonne: 7,
    pixelYStartPosition: 90,
    pixelXStartPosition: 112,
    distanceBetween: 15,
    stroke: 'rgba(90, 195, 216)',
    fill: 'rgba(90, 195, 216)'
  }

  var structureProfileData = {
    type: 'line',
    options: {
      legend: {
        display: false
      },
      scales: {
        yAxes: [
          {
            gridLines: {
              drawBorder: false,
              display: false
            },
            display: false,
            ticks: {
              beginAtZero: true,
              stepSize: 3
            }
          }
        ],
        xAxes: [
          {
            gridLines: {
              drawBorder: false,
              display: false
            }
          }
        ]
      }
    },
    maintainAspectRatio: false,
    data: {
      labels: ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      datasets: [
        {
          label: '',
          fill: true,
          lineTension: 0.5,
          backgroundColor: '#005597',
          borderColor: 'rgba(75,192,192,1)',
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'miter',
          pointBorderColor: 'rgba(75,192,192,1)',
          pointBackgroundColor: '#fff',
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: 'rgba(75,192,192,1)',
          pointHoverBorderColor: 'rgba(220,220,220,1)',
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -7]
        }
      ]
    }
  }

  var correzzione = []
  var zMassimo = 1080
  var activeCorrection = false
  var massimo = 0

  var arrayData = []

  var rows = []

  $scope.nextStep = function () {
    // alert('bravo');
    $scope.testStep++
  }

  $scope.selectType = function (type) {
    $scope.typeTest = type
    $scope.nextStep()
  }

  var generateData = function (ref) {
    // console.log('ref', ref);

    // --------------------
    // MATTEO
    rows = []
    // --------------------

    var data = new vis.DataSet()
    var base = 0
    var counter = 0
    for (var x = 0; x < arrayTemplate.numeroRighe; x++) {
      for (var y = 0; y < arrayTemplate.numeroColonne; y++) {
        var value = 0
        if (x % 2 === 0) {
          if (y % 2 === 0) {
            // console.log('colonna pari riga pari arrayData[counter] != undefined')
            if (typeof ref[counter / 2] !== 'undefined' && Number(ref[counter / 2].replace(',', '.')) > tolleranza) {
              value = Number(ref[counter / 2].replace(',', '.'))
            } else {
              value = 0
            }
            arrayData[counter] = {
              x: x,
              y: y,
              z: -value
              // style: Math.abs(value-zMassimo)
            }
          } else if (y % 2 !== 0) {
            // console.log('colonna pari riga dipari arrayData[counter] != undefined')
            var middle = []
            if (typeof ref[(counter - 1) / 2] !== 'undefined') {
              middle.push(Number(ref[(counter - 1) / 2].replace(',', '.')))
            }
            if (typeof ref[(counter + 1) / 2] !== 'undefined') {
              middle.push(Number(ref[(counter + 1) / 2].replace(',', '.')))
            }
            if (typeof ref[(counter - 7) / 2] !== 'undefined') {
              middle.push(Number(ref[(counter - 7) / 2].replace(',', '.')))
            }
            if (typeof ref[(counter + 7) / 2] !== 'undefined') {
              middle.push(Number(ref[(counter + 7) / 2].replace(',', '.')))
            }
            // console.log('middle 4',middle)
            // console.log('counter',counter)
            for (var s in middle) {
              value += middle[s]
            }

            value = value / middle.length

            if (value < tolleranza) {
              value = 0
            }

            arrayData[counter] = {
              x: x,
              y: y,
              z: -value
              // style: Math.abs(value-zMassimo)
            }
          }
        } else {
          if (y % 2 !== 0) {
            if (typeof ref[counter / 2] !== 'undefined' && Number(ref[counter / 2].replace(',', '.')) > tolleranza) {
              value = Number(ref[counter / 2].replace(',', '.'))
            } else {
              value = 0
            }
            arrayData[counter] = {
              x: x,
              y: y,
              z: -value
              // style: Math.abs(value-zMassimo)
            }
          } else if (y % 2 === 0) {
            var middle = []
            if (counter % 7 === 0) {
              if (typeof ref[(counter + 1) / 2] !== 'undefined') {
                middle.push(Number(ref[(counter + 1) / 2].replace(',', '.')))
              }
            } else if (counter % 7 === 6) {
              if (typeof ref[(counter - 1) / 2] !== 'undefined') {
                middle.push(Number(ref[(counter - 1) / 2].replace(',', '.')))
              }
            }

            if (typeof ref[(counter - 7) / 2] !== 'undefined') {
              middle.push(Number(ref[(counter - 7) / 2].replace(',', '.')))
            }
            if (typeof ref[(counter + 7) / 2] !== 'undefined') {
              middle.push(Number(ref[(counter + 7) / 2].replace(',', '.')))
            }
            // console.log('middle 3',middle)
            // console.log('counter',counter)
            // console.log('value',value);
            for (var s in middle) {
              value += middle[s]
            }
            value = value / middle.length
            if (value < tolleranza) {
              value = 0
            }
            arrayData[counter] = {
              x: x,
              y: y,
              z: -value
              // style: Math.abs(value-zMassimo)
            }
          }
        }

        // if(){
        /* data.add({
         x: x,
         y: y,
         z: value,
         style: value
         }); */
        // }

        counter++
      }
      if (x % 2 === 0) {
        base += 3
      } else {
        base += 2
      }
    }

    for (var s in arrayData) {
      // console.log('for di arrayData',s);
      // console.log('arrayData[s]',arrayData[s]);
      data.add(arrayData[s])

      // ++++++++++++++++++
      // MATTEO

      // rows = [
      //     {'""': "0", 0: "0"},
      //     {'""': "1", 1: "1"},
      //     {'""': "2", 2: "2"},
      //     {'""': "3", 3: "3"},
      //     {'""': "4", 4: "4"},
      //     {'""': "5", 5: "5"},
      //     {'""': "6", 6: "6"},
      //     {'""': "7", 7: "7"},
      //     {'""': "8", 8: "8"},
      //     {'""': "10", 10: "10"},
      //     {'""': "9", 9: "9"}
      // ];

      // x = indice array, y = key JSON, z = value JSON
      if (rows[Number(arrayData[s].x)] === undefined) {
        rows[Number(arrayData[s].x)] = {
          '""': String(Number(arrayData[s].x))
        }
      }

      rows[Number(arrayData[s].x)][String(Number(arrayData[s].y))] = String(Number(arrayData[s].z))

      // ++++++++++++++++++
    }

    rows.sort(function (a, b) {
      return Number(a['""']) - Number(b['""'])
    })

    // console.log("arrayData: ", arrayData);
    // console.log("rows: ", rows);
    // console.log('arrayData',arrayData);
    // console.log('DATA!!!!!!!!',data)
    // counter = 0;

    return rows
  }

  var unpack = function (rows, key) {
    return rows.map(function (row) {
      return row[key] || '0'
    })
  }

  var get2dData = function (data) {
    var data2d = []
    for (var x in data) {
      var yCount = 0
      var temp = {
        x: -Number(x)
      }

      for (var y in data[x]) {
        if (y !== '""') {
          if (temp.y === undefined) {
            temp.y = Number(data[x][y])
          } else {
            temp.y += Number(data[x][y])
          }
          yCount++
        }
      }

      temp.y /= yCount

      data2d.push(temp)
    }

    var xMin, xMax
    for (var h in data2d) {
      if (xMin === undefined || data2d[h].x < xMin) {
        xMin = data2d[h].x
      }

      if (xMax === undefined || data2d[h].x > xMax) {
        xMax = data2d[h].x
      }
    }

    for (var s = xMax + 1; s < xMax + 7; s++) {
      data2d.push({
        x: s,
        y: 0
      })
    }

    for (var e = xMin - 1; e >= xMin - 7; e--) {
      data2d.push({
        x: e,
        y: 0
      })
    }

    return data2d
  }

  var generateCubeData = function (ref) {
    // console.log('ref', ref);

    var data = new vis.DataSet()
    var base = 0
    var counter = 0
    for (var x = 0; x < arrayTemplate.numeroRighe; x++) {
      for (var y = 0; y < arrayTemplate.numeroColonne; y++) {
        var value = 0
        if (x % 2 === 0) {
          if (y % 2 === 0) {
            // console.log('colonna pari riga pari arrayData[counter] != undefined')
            if (typeof ref[counter / 2] !== 'undefined' && Number(ref[counter / 2].replace(',', '.')) > tolleranza) {
              value = Number(ref[counter / 2].replace(',', '.'))
            } else {
              value = 0
            }
            arrayData[counter] = {
              x: -x,
              y: -y,
              z: -value
              // style: Math.abs(value-zMassimo)
            }
          } else if (y % 2 !== 0) {
            // console.log('colonna pari riga dipari arrayData[counter] != undefined')
            var middle = []
            if (typeof ref[(counter - 1) / 2] !== 'undefined') {
              middle.push(Number(ref[(counter - 1) / 2].replace(',', '.')))
            }
            if (typeof ref[(counter + 1) / 2] !== 'undefined') {
              middle.push(Number(ref[(counter + 1) / 2].replace(',', '.')))
            }
            if (typeof ref[(counter - 7) / 2] !== 'undefined') {
              middle.push(Number(ref[(counter - 7) / 2].replace(',', '.')))
            }
            if (typeof ref[(counter + 7) / 2] !== 'undefined') {
              middle.push(Number(ref[(counter + 7) / 2].replace(',', '.')))
            }
            // console.log('middle 4',middle)
            // console.log('counter',counter)
            for (var s in middle) {
              value += middle[s]
            }

            value = value / middle.length
            if (value < tolleranza) {
              value = 0
            }
            arrayData[counter] = {
              x: -x,
              y: -y,
              z: -value
              // style: Math.abs(value-zMassimo)
            }
          }
        } else {
          if (y % 2 !== 0) {
            if (typeof ref[counter / 2] !== 'undefined' && Number(ref[counter / 2].replace(',', '.')) > tolleranza) {
              value = Number(ref[counter / 2].replace(',', '.'))
            } else {
              value = 0
            }
            arrayData[counter] = {
              x: -x,
              y: -y,
              z: -value
              // style: Math.abs(value-zMassimo)
            }
          } else if (y % 2 === 0) {
            var middle = []
            if (counter % 7 === 0) {
              if (typeof ref[(counter + 1) / 2] !== 'undefined') {
                middle.push(Number(ref[(counter + 1) / 2].replace(',', '.')))
              }
            } else if (counter % 7 === 6) {
              if (typeof ref[(counter - 1) / 2] !== 'undefined') {
                middle.push(Number(ref[(counter - 1) / 2].replace(',', '.')))
              }
            }

            if (typeof ref[(counter - 7) / 2] !== 'undefined') {
              middle.push(Number(ref[(counter - 7) / 2].replace(',', '.')))
            }
            if (typeof ref[(counter + 7) / 2] !== 'undefined') {
              middle.push(Number(ref[(counter + 7) / 2].replace(',', '.')))
            }
            // console.log('middle 3',middle)
            // console.log('counter',counter)
            // console.log('value',value);
            for (var s in middle) {
              value += middle[s]
            }
            value = value / middle.length
            if (value < tolleranza) {
              value = 0
            }
            arrayData[counter] = {
              x: -x,
              y: -y,
              z: -value
              // style: Math.abs(value-zMassimo)
            }
          }
        }

        // if(){
        /* data.add({
         x: x,
         y: y,
         z: value,
         style: value
         }); */
        // }

        counter++
      }
      if (x % 2 === 0) {
        base += 3
      } else {
        base += 2
      }
    }

    var media = 0
    var pesiMedia = 0
    for (var s in arrayData) {
      media += Number(arrayData[s].z)
      pesiMedia = s
      // console.log("arrayData[s].z",arrayData[s].z);
      // console.log("media",media);
      // console.log("pesiMedia",pesiMedia);
      data.add(arrayData[s])
    }

    // se non c'è nessuno sul materasso e prima non c'era nessuno
    if (Math.abs(media) / pesiMedia < 40 && $scope.azzeramentoTara === 0) {
      console.log('materasso libero faccio la tare')
      $scope.azzeramentoTara = 1
      /* $scope.tara = $scope.peso;
       currentObject.update("tara", $scope.peso, true, false); */
      // se non c'è nessuno sul materasso e ho già fatto la tara
    } else if (Math.abs(media) / pesiMedia < 40 && $scope.azzeramentoTara === 1) {

      // se c'è qualcuno sul materasso e ho già fatto la tara
    } else if (Math.abs(media) / pesiMedia > 40 && $scope.azzeramentoTara === 1) {
      console.log(' ce qualcuno')
      $scope.azzeramentoTara = 2
      // se non c'è nessuno sul materasso e prima c'era qualcuno
    }
    if (Math.abs(media) / pesiMedia < 40 && $scope.azzeramentoTara === 2) {
      console.log('materasso di nuovo libero')
      $scope.azzeramentoTara = 0
    }

    return data
  }

  var generateProfilData = function (array) {
    var profileArray = []
    var rowNumber = 0
    for (var s in array) {
      if (s === 0) {
        array[s] = 0
      }
      // console.log("array[s]",array[s].z);
      if ((1 + Number(s)) % 7 === 0) {
        // console.log("verifica array",Number(s)-4,Number(s)-3,Number(s)-2)
        profileArray[13 - rowNumber] = (Number(array[Number(s) - 4].z) + Number(array[Number(s) - 3].z) + Number(array[Number(s) - 2].z)) / 3
        rowNumber++
      } else {
      }
    }

    $scope.lastProfileData = profileArray
    return profileArray
  }

  // QUESTA FUNZIONE SERVE PER GENERARE IL GRAFICO DELL'OMINO DI PROFILO
  var generateProfilGraph = function (pointArray) {
    var dataToSet = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    for (var s in pointArray) {
      // console.log("for generateProfilGraph ",pointArray[s]);
      if (pointArray[s] === 0) {
        dataToSet[4 + Number(s)] = pointArray[s]
      } else {
        dataToSet[5 + Number(s)] = ((-pointArray[s]) / $scope.correzzioneMatrixSens)
      }
    }
    if (myChart) {
      myChart.data.datasets[0].data = dataToSet
      myChart.updateDatasets()
      myChart.render(1, 1)
    }
  }

  // QUESTA FUNZIONE SERVE PER NORMALIZZARE I DATI, RICOSTRUISCE IL VALORE DEI SENSORI MANCANTI PERTENDO DA QUELLI PRESENTI
  var normalizeData = function (ref) {
    // console.log('ref', ref);
    var base = 0
    var counter = 0

    var tempArrayData = []

    // console.log("numero totale righe normalize", arrayTemplate.numeroRighe);
    // console.log("numero totale colonne normalize", arrayTemplate.numeroColonne);
    // if(Number($scope.peso) > 30){
    if (true) {
      for (var x = 0; x < arrayTemplate.numeroRighe; x++) {
        // console.log("riga normalize", x);

        for (var y = 0; y < arrayTemplate.numeroColonne; y++) {
          // console.log("$scope.peso", $scope.peso);
          // console.log("$scope.peso + tara", 30 + $scope.tara);
          var value = 0
          if (x % 2 === 0) {
            if (y % 2 === 0) {
              // console.log('colonna pari riga pari tempArrayData[counter] != undefined')
              if (typeof ref[counter / 2] !== 'undefined' && Number(ref[counter / 2].replace(',', '.')) > tolleranza) {
                value = Number(ref[counter / 2].replace(',', '.'))
              } else {
                value = 0
              }
              tempArrayData[counter] = {
                x: x,
                y: y,
                z: Math.abs(value)
                // style: Math.abs(value-zMassimo)
              }
            } else if (y % 2 !== 0) {
              // console.log('colonna pari riga dipari tempArrayData[counter] != undefined')
              var middle = []
              if (typeof ref[(counter - 1) / 2] !== 'undefined') {
                middle.push(Number(ref[(counter - 1) / 2].replace(',', '.')))
              }
              if (typeof ref[(counter + 1) / 2] !== 'undefined') {
                middle.push(Number(ref[(counter + 1) / 2].replace(',', '.')))
              }
              if (typeof ref[(counter - 7) / 2] !== 'undefined') {
                middle.push(Number(ref[(counter - 7) / 2].replace(',', '.')))
              }
              if (typeof ref[(counter + 7) / 2] !== 'undefined') {
                middle.push(Number(ref[(counter + 7) / 2].replace(',', '.')))
              }
              // console.log('middle 4',middle)
              // console.log('counter',counter)
              for (var s in middle) {
                value += middle[s]
              }

              value = value / middle.length
              if (value < tolleranza) {
                value = 0
              }
              tempArrayData[counter] = {
                x: x,
                y: y,
                z: Math.abs(value)
                // style: Math.abs(value-zMassimo)
              }
            }
          } else {
            if (y % 2 !== 0) {
              if (typeof ref[counter / 2] !== 'undefined' && Number(ref[counter / 2].replace(',', '.')) > tolleranza) {
                value = Number(ref[counter / 2].replace(',', '.'))
              } else {
                value = 0
              }
              tempArrayData[counter] = {
                x: x,
                y: y,
                z: Math.abs(value)
                // style: Math.abs(value-zMassimo)
              }
            } else if (y % 2 === 0) {
              var middle = []
              if (counter % 7 === 0) {
                if (typeof ref[(counter + 1) / 2] !== 'undefined') {
                  middle.push(Number(ref[(counter + 1) / 2].replace(',', '.')))
                }
              } else if (counter % 7 === 6) {
                if (typeof ref[(counter - 1) / 2] !== 'undefined') {
                  middle.push(Number(ref[(counter - 1) / 2].replace(',', '.')))
                }
              }

              if (typeof ref[(counter - 7) / 2] !== 'undefined') {
                middle.push(Number(ref[(counter - 7) / 2].replace(',', '.')))
              }
              if (typeof ref[(counter + 7) / 2] !== 'undefined') {
                middle.push(Number(ref[(counter + 7) / 2].replace(',', '.')))
              }
              // console.log('middle 3',middle)
              // console.log('counter',counter)
              // console.log('value',value);
              for (var s in middle) {
                value += middle[s]
              }
              value = value / middle.length
              if (value < tolleranza) {
                value = 0
              }
              tempArrayData[counter] = {
                x: x,
                y: y,
                z: Math.abs(value)
                // style: Math.abs(value-zMassimo)
              }
            }
          }

          counter++
        }
        // console.log('normalize return'/*,tempArrayData*/);
      }
      $scope.lastMatrixData = tempArrayData
      // console.log("----------------- $scope.lastMatrixData = ", $scope.lastMatrixData);
      // alert($scope.lastMatrixData.toString())

      // console.log("data for report", JSON.stringify($scope.lastMatrixData));
      return tempArrayData
    } else {
      // console.log("non c'è nessuno sul materasso metto tutto a zero");
      for (var x = 0; x < arrayTemplate.numeroRighe; x++) {
        for (var y = 0; y < arrayTemplate.numeroColonne; y++) {
          tempArrayData[counter] = {
            x: x,
            y: y,
            z: 0
            // style: Math.abs(value-zMassimo)
          }
          counter++
        }
      }
      $scope.lastMatrixData = tempArrayData
      return tempArrayData
    }
  }

  var mirrorMatrix = function (ref) {
    var mirror = []
    var totalRow = 7
    var indexMirror = 6
    for (var s = 0; s <= ref.length - 1; s++) {
      indexMirror = (totalRow - 1) + ((totalRow) * ((parseInt(s / (totalRow)) * 2))) - s

      console.log('s is:', s)
      console.log('indexMirror is:', indexMirror)

      mirror[indexMirror] = ref[s]
    }

    return mirror
  }

  // QUESTA FUNZIONE ANALIZZA I DATI PROVENIENTI DAI SENSORI DI POSTURA E RICONOSCE LA POSIZIONE SUPINA, SINISTRA O DESTRA
  // INOLTRE LA FUNZIONE VIENE SFRUTTATA PER TARARE I SENSORI DI PESO QUANDO NESSUNO E' SUL MATERASSO
  var detectHumanPositionOnTheBed = function (matrix) {
    // console.log("detected human position");
    // console.log(matrix);
    var position = 'top'
    var thisRow = 1
    var thisColl = 0

    var leftIndex = 0
    var rightIndex = 0

    for (var s in matrix) {
      thisColl++
      var n = s + 1

      // console.log("colonna numero", thisColl);

      if (thisColl <= 3) {
        // console.log("sommo a sinistra");
        leftIndex = leftIndex + matrix[s].z
      } else if (thisColl === 4) {
        // console.log("sommo a metà");
        leftIndex = leftIndex + matrix[s].z
        rightIndex = rightIndex + matrix[s].z
      } else if (thisColl > 4) {
        // console.log("sommo a destra");
        rightIndex = rightIndex + matrix[s].z
      }

      // console.log("colonna valore", matrix[s].z);

      if (n % 7 === 0) {
        thisColl = 0
        thisRow++
      }
    }

    // console.log("left and right vale", leftIndex, rightIndex);
    if (leftIndex > rightIndex && Math.abs(leftIndex - rightIndex) > $scope.tolleranceLeftRight) {
      // console.log("sei a sinistra return 0");
      return 0
    } else if (rightIndex > leftIndex && Math.abs(leftIndex - rightIndex) > $scope.tolleranceLeftRight) {
      // console.log("sei a destra return 1");
      return 1
    } else if (rightIndex > 100 && leftIndex > 100) {
      // console.log("sei sul dorso return 2");
      return 2
    } else if (rightIndex < 100 && leftIndex < 100) {
      return 3
    }
  }

  // QUESTA FUNZIONE GENERA IL GRAFICO DEI PALLINI SULLA SAGOMA SUPIO, SINISTRO, DESTRO
  var createSvgMatrixHumanGraph = function () {
    // console.log("devo generare una matrice di: " + arrayTemplate.numeroRighe + "righe e:" + arrayTemplate.numeroColonne + "colonne");
    var tempSvg = document.getElementById('sagomaInterattiva')
    var widthSVG = tempSvg.clientWidth
    var heightSVG = tempSvg.clientHeight

    // arrayTemplate.pixelYStartPosition = parseInt(heightSVG/5);
    // arrayTemplate.pixelXStartPosition = parseInt(widthSVG/(3/1.15));
    // arrayTemplate.distanceBetween = parseInt(widthSVG/(((3/1.15))*9.25));

    console.log('widthSVG', widthSVG)
    console.log('heightSVG', heightSVG)
    console.log('arrayTemplate.pixelYStartPosition', arrayTemplate.pixelYStartPosition)
    console.log('arrayTemplate.pixelXStartPosition', arrayTemplate.pixelXStartPosition)

    for (var x = 0; x < arrayTemplate.numeroRighe; x++) {
      // console.log("genero righe svg", x);
      var g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      g.setAttribute('id', 'riga' + (x + 1))
      tempSvg.appendChild(g)

      // calcolo posizione Y
      var cy = arrayTemplate.pixelYStartPosition + (arrayTemplate.distanceBetween * x)
      $scope.matrixHumanSvg['"' + x + '"'] = {}
      for (var y = 0; y < arrayTemplate.numeroColonne; y++) {
        // console.log("genero colonne svg", y)

        var value = 0

        tempSvg.appendChild(g)

        // calcolo posizione x
        var cx = arrayTemplate.pixelXStartPosition + (arrayTemplate.distanceBetween * y)

        var newCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        newCircle.setAttribute('id', 'elementMatrix' + (arrayTemplate.numeroRighe - 1 - x) + y)
        newCircle.setAttribute('cx', cx)
        newCircle.setAttribute('cy', cy)
        newCircle.setAttribute('r', 1)
        newCircle.setAttribute('stroke', arrayTemplate.stroke)
        newCircle.setAttribute('stroke-width', 1)
        newCircle.setAttribute('fill', arrayTemplate.fill)
        g.appendChild(newCircle)

        $scope.matrixHumanSvg['"' + x + '"']['"' + y + '"'] = {
          r: 1,
          stroke: 'green',
          strokeWidth: 1,
          fill: 'yellow'

        }
      }
    }
    // console.log('$scope.matrixHumanSvg' , $scope.matrixHumanSvg);
  }

  // funzione che aggiorna i pallini indice della pressione sulla sagoma
  var updateSvgMatrixHumanGraph = function (matrixUpdate) {
    var countRow = 0
    var countColl = 0
    var conunterTemp = 0
    for (var s in matrixUpdate) {
      conunterTemp++

      document.getElementById('elementMatrix' + countRow + countColl).setAttribute('r', matrixUpdate[s].z / $scope.correzzioneMatrixSens)
      // console.log("selezioni l'elemento: elementMatrix " + countRow + countColl);

      if (conunterTemp !== 0 && conunterTemp % 7 === 0) {
        countRow++
        countColl = 0
      } else {
        countColl++
      }
    }
  }

  socket.on('apio_server_update', function (data) {
    // console.log("data",data);
    if (data.properties.hasOwnProperty('move')) {
      console.log('MOVE 0', data.properties.move)
      $scope.move = parseInt(data.properties.move)
    }
  })

  $scope.$watch('object.properties.pes', function (newValue) {
    // console.log("WATCH PES", newValue);
    var pesoTemp = 0
    if (newValue && newValue.indexOf('|') > -1) {
      var z = newValue.split('|')
      // console.log("z prima",z)
      if (true) {
        for (var i = 0; i <= z.length - 2; i++) {
          if (i === 0) {
            $scope.peso1 = Number(z[i].replace(',', '.'))
            // console.log("peso sensore 1", $scope.peso1);
          } else if (i === 1) {
            $scope.peso2 = Number(z[i].replace(',', '.'))

            // console.log("peso sensore 2", $scope.peso2);
          } else if (i === 2) {
            $scope.peso3 = Number(z[i].replace(',', '.'))
            // console.log("peso sensore 3", $scope.peso3);
          } else if (i === 3) {
            $scope.peso4 = Number(z[i].replace(',', '.'))
            // console.log("peso sensore 4", $scope.peso4);
          }
        }
        pesoTemp = $scope.peso1 + $scope.peso2 + $scope.peso3 + $scope.peso4

        pesoTemp = pesoTemp / 2.5325
        var positionDetected = detectHumanPositionOnTheBed($scope.lastMatrixRecive)
        if (positionDetected === 3 && pesoTemp < 190) {
          console.log("ESEGUO LA TARA! LA NUAVA TARA E' ", $scope.tara)
          $scope.tara = pesoTemp
          currentObject.update('tara', String($scope.tara).replace('.', ','), true, false)
        } else {
          // console.log("LA VECCHIA TARA E' ", $scope.tara);
        }
        pesoTemp = pesoTemp
        // console.log("z[i] dopo elaborazione sommato", pesoTemp);
        if (!isNaN($scope.tara) && !isNaN($scope.peso)) {
          // console.log('con tara', pesoTemp);
          pesoTemp = pesoTemp - Number($scope.tara)
        } else {
          // console.log('senza tara');
          pesoTemp = pesoTemp
        }
        $scope.peso = Math.abs(pesoTemp.toFixed(2))
        var tempImc = $scope.peso / (($scope.altezza / 100) * ($scope.altezza / 100))
        $scope.imc = tempImc.toFixed(2)
        
      }
    }
  })

  // ricevo i dati della matrice di sensori sul materasso
  $scope.$watch('object.properties.mat', function (newValue) {
    // console.log("WATCH MAT::::", newValue);
    if (newValue && newValue.indexOf('|') > -1) {
      // console.log("newValue is true");
      if (/* graph && graph2d && graph3d */ $scope.drawingOk) {
        var z = newValue.split('|')

        // INIZIO NUOVA PARTE SVG
        var dataHumanMatrix = normalizeData(z)
        console.log('Matrix Normalize', dataHumanMatrix)

        $scope.lastMatrixRecive = JSON.parse(JSON.stringify(dataHumanMatrix))

        dataHumanMatrix = mirrorMatrix(dataHumanMatrix)
        console.log('Matrix Mirror', dataHumanMatrix)
        // console.log("dataHumanMatrix = ", dataHumanMatrix);

        var positionDetected = $scope.positionDetected = detectHumanPositionOnTheBed(dataHumanMatrix)
        // console.log("------- positionDetected = ", positionDetected);
        // console.log("------- $scope.positionDetected = ", $scope.positionDetected);

        var profileData = generateProfilData(dataHumanMatrix)
        generateProfilGraph(profileData)

        var sagomaBackground = document.getElementById('sagomaManichino')

        var profiloBackground = document.getElementById('profilo')
        if (positionDetected === 0) {
          /* posizione fetale destra */
          if ($scope.sesso === 'uomo') {
            sagomaBackground.classList.remove('sagomaLeftUomo')
            sagomaBackground.classList.add('sagomaRightUomo')

            sagomaBackground.classList.remove('sagomaLeftDonna')
            sagomaBackground.classList.remove('sagomaRightDonna')
          } else if ($scope.sesso === 'donna') {
            sagomaBackground.classList.remove('sagomaLeftDonna')
            sagomaBackground.classList.add('sagomaRightDonna')

            sagomaBackground.classList.remove('sagomaLeftUomo')
            sagomaBackground.classList.remove('sagomaRightUomo')
          }

          // profiloBackground.classList.remove('prfiloFrontale');
          // profiloBackground.classList.add('prfiloLaterale');
        } else if (positionDetected === 1) {
          /* posizione fetale sinistra */
          if ($scope.sesso === 'uomo') {
            sagomaBackground.classList.add('sagomaLeftUomo')
            sagomaBackground.classList.remove('sagomaRightUomo')

            sagomaBackground.classList.remove('sagomaLeftDonna')
            sagomaBackground.classList.remove('sagomaRightDonna')
          } else if ($scope.sesso === 'donna') {
            sagomaBackground.classList.add('sagomaLeftDonna')
            sagomaBackground.classList.remove('sagomaRightDonna')

            sagomaBackground.classList.remove('sagomaLeftUomo')
            sagomaBackground.classList.remove('sagomaRightUomo')
          }
          // profiloBackground.classList.remove('prfiloFrontale');
          // profiloBackground.classList.add('prfiloLaterale');
        } else if (positionDetected === 2 || positionDetected === 3) {
          /* posizione supina */
          if ($scope.sesso === 'uomo') {
            sagomaBackground.classList.remove('sagomaLeftUomo')
            sagomaBackground.classList.remove('sagomaRightUomo')

            sagomaBackground.classList.remove('sagomaLeftDonna')
            sagomaBackground.classList.remove('sagomaRightDonna')
          } else if ($scope.sesso === 'donna') {
            sagomaBackground.classList.remove('sagomaLeftDonna')
            sagomaBackground.classList.remove('sagomaRightDonna')

            sagomaBackground.classList.remove('sagomaLeftUomo')
            sagomaBackground.classList.remove('sagomaRightUomo')
          }
          // profiloBackground.classList.remove('prfiloLaterale');
          // profiloBackground.classList.add('prfiloFrontale');
        }
        updateSvgMatrixHumanGraph(dataHumanMatrix)
        // FINE NUOVA PARTE SVG

        // console.log("call generateCubeData");
      } else {

      }
    }
  })

  $timeout(function () {
    // INIZIO NUOVO SVG SAGOMA

    // FINE NUOVO SVG SAGOMA
    setTimeout(function () {
      // alert($scope.testStep)
      createSvgMatrixHumanGraph()
      $scope.drawingOk = true
      // var z = newValue.split("|");
      var z = ['199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199', '199']

      massimo = parseInt(z[0])
      for (var i = 0; i <= z.length - 2; i++) {
        correzzione.push(parseInt(z[i]))
        if (z[i + 1] !== 'NaN' && parseInt(z[i]) >= massimo) {
          massimo = parseInt(z[i])
        }
      }

      var elem = document.getElementsByClassName('topAppApplication')[0]
      var ctx = document.getElementById('graficoProfilo')
      myChart = new Chart(ctx, structureProfileData)
      /* setTimeout(function(){
        myChart.data.datasets[0].data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  myChart.updateDatasets();
  myChart.render(1, 1);
      }, 500) */
    }, 1000)
  }, 0)

  /* Person Config functions and variables ----------------------------- */
  /* Modal that enable to change the person configuration */
  $scope.personConfigModal = function () {
    $mdDialog.show({
      templateUrl: 'applications/' + $scope.object.objectId + '/modal/person_config_modal.tmpl.html',
      controller: PersonConfigModalController,
      clickOutsideToClose: true,
      bindToController: true,
      // controllerAs: HomeController,
      scope: $scope,
      preserveScope: true,
      parent: angular.element(document.getElementById('targetBody')),
      // targetEvent: ev,
      fullscreen: true
    }).then(function (answer) {
      // console.log(" ---------- dentro al than ---------");
    }, function () {
      // console.log(" ---------- dentro al function ---------");
    })
  }

  function PersonConfigModalController ($scope, $mdDialog) {
    $scope.hide = function () {
      $mdDialog.hide()
    }

    $scope.cancel = function () {
      $mdDialog.cancel()
    }

    $scope.answer = function (answer) {
      $mdDialog.hide(answer)
    }
  }

  /* WIZARD functions and variables ----------------------------- */
  $scope.resetTest = function () {
    currentObject.update('reset', '0')
    $scope.selectedMattresses = []
    $scope.testStarted = false
    $scope.personName = ''
    $scope.personSurname = ''
    $scope.personAge = null
    $scope.altezza = 160
    $scope.sesso = 'uomo'

    $scope.testStep = -1
    $scope.testStepProgress = 14.55
    console.log('reset')
  }
  $scope.resetTest()
  $scope.testStep = -3

  $scope.newTest = function () {
    currentObject.update('reset', '0')
    $scope.numTestDone = 0
    var sagomaBackground = document.getElementById('sagomaManichino')

    sagomaBackground.classList.remove('sagomaLeftUomo')
    sagomaBackground.classList.remove('sagomaRightUomo')
    sagomaBackground.classList.remove('sagomaLeftDonna')
    sagomaBackground.classList.remove('sagomaRightDonna')

    console.log('$scope.selectedMattresses', $scope.selectedMattresses)
    $scope.testStepProgress = 14.55
    $scope.testStep = -2
    $scope.testResult = [{
      step1: {
        testLastMatrix: [],
        lastProfileData: [],
        peso: []
      },
      step2: {
        testLastMatrix: [],
        lastProfileData: [],
        peso: []
      },
      step3: {
        testLastMatrix: [],
        lastProfileData: [],
        peso: []
      },
      infoPerson: {}
    }]
    $scope.sesso = 'uomo'
    $scope.sex = 0
    $scope.altezza = 160
    $scope.personName = ''
    $scope.personSurname = ''
    $scope.personAge = null
    $scope.personEmail = ''
    $scope.personAddr = ''
    $scope.personCity = ''
    $scope.personCell = ''
    $scope.verifiedInfoClients = false
    $scope.$apply()
  }

  $scope.testResult = [{
    step1: {
      testLastMatrix: [],
      lastProfileData: [],
      peso: []
    },
    step2: {
      testLastMatrix: [],
      lastProfileData: [],
      peso: []
    },
    step3: {
      testLastMatrix: [],
      lastProfileData: [],
      peso: []
    },
    infoPerson: {}
  }]

  // se viene rilevata una posizione e il test è partito allora inizio l'acquisizione dei dati in base allo step in cui mi trovo
  //
  $scope.$watch('positionDetected', function (newValue, oldValue) {
    console.log('WATCH positionDetected newValue = ', newValue)
    console.log('WATCH positionDetected oldValue = ', oldValue)
    if ($scope.testStarted) {
      if (newValue === 2 && $scope.testStep === 0) {
        setTimeout(function () {
          console.log('@@@@@@@@@@@@@@@@@@@@@@')
          console.log('SONO NEL WATCH CASO 1, $scope.testStepInterval VALE: ', $scope.testStepInterval)
          console.log('@@@@@@@@@@@@@@@@@@@@@@')
          $scope.verifyCorrectDataPosition()
          console.log('acquisisco dati supino')
          $scope.sagomaBorderYellow = false
          $scope.sagomaBorderGreen = true
          $scope.$applyAsync()
        }, 1300)
      } else if (newValue === 1 && $scope.testStep === 1) {
        setTimeout(function () {
          console.log('@@@@@@@@@@@@@@@@@@@@@@')
          console.log('SONO NEL WATCH CASO 2, $scope.testStepInterval VALE: ', $scope.testStepInterval)
          console.log('@@@@@@@@@@@@@@@@@@@@@@')
          $scope.verifyCorrectDataPosition()
          console.log('acquisisco dati sinistra')
          $scope.sagomaBorderYellow = false
          $scope.sagomaBorderGreen = true
          $scope.$applyAsync()
        }, 1300)
      } else if (newValue === 0 && $scope.testStep === 2) {
        setTimeout(function () {
          console.log('@@@@@@@@@@@@@@@@@@@@@@')
          console.log('SONO NEL WATCH CASO 3, $scope.testStepInterval VALE: ', $scope.testStepInterval)
          console.log('@@@@@@@@@@@@@@@@@@@@@@')
          $scope.verifyCorrectDataPosition()
          console.log('acquisisco dati destra')
          $scope.sagomaBorderYellow = false
          $scope.sagomaBorderGreen = true
          $scope.$applyAsync()
        }, 1300)
      } else {
        clearInterval($scope.testStepInterval)
        $scope.testStepInterval = null
        // $scope.testStepProgress = 14.55;
        $scope.testResult[$scope.stepTypeTest]['step' + Number(1 + $scope.testStep)].testLastMatrix = []
        $scope.testResult[$scope.stepTypeTest]['step' + Number(1 + $scope.testStep)].lastProfileData = []
        $scope.testResult[$scope.stepTypeTest]['step' + Number(1 + $scope.testStep)].peso = []
        $scope.testResult[$scope.stepTypeTest]['step' + Number(1 + $scope.testStep)].infoPerson = {}
      }
    }
  })

  $scope.personName = ''
  $scope.personSurname = ''
  $scope.personAge = null

  var tableReferMat = {
    'singolo': {
      'livello1': {
        'g/cm3': {
          'min': 9.114654304,
          'max': 10.11009634
        },
        'name': 'livello 1',
        'materassi': ['Vanity', 'Elisir'],
        'step': 25
      },
      'livello2': {
        'g/cm3': {
          'min': 10.11009635,
          'max': 11.10553838
        },
        'name': 'livello 2',
        // "materassi" : ['Bliss','Aquagel'],
        'materassi': ['Aniversario 50', 'Lady Soft', 'Aquagel'],
        'step': 90
      },
      'livello3': {
        'g/cm3': {
          'min': 11.10553839,
          'max': 12.10098042
        },
        'name': 'livello 3',
        'materassi': ['Lady Memory', 'Lady Più', 'Memory'],
        'step': 150
      },
      'livello4': {
        'g/cm3': {
          'min': 12.10098043,
          'max': 13.09642246
        },
        'name': 'livello 4',
        'materassi': ['Cover', 'Dormiglione', 'Strabilio'],
        'step': 258
      },
      'livello5': {
        'g/cm3': {
          'min': 13.09642247,
          'max': 18
        },
        'name': 'livello 5',
        'materassi': ['Brio', 'Oblio AP', 'Fitness'],
        'step': 380
      }
    },
    'matrimoniale': {

    }
  }
  $scope.calculateLevel = function (data) {
    console.log('calculateLevel!!', data)
    var mosteller = Math.sqrt((data.peso * (data.altezza / 3600)))
    console.log('mosteller = ', mosteller)
    var supInfCorpo = mosteller / 3
    console.log('supInfCorpo', supInfCorpo)
    var forzaPeso = data.peso * 9.81
    console.log('forzaPeso', forzaPeso)
    var pressionePA = forzaPeso / supInfCorpo
    console.log('pressionePA', pressionePA)
    var pressioneGCM3 = pressionePA / 98.1
    console.log('pressioneGCM3', pressioneGCM3)
    return pressioneGCM3
  }

  // alert('prova che è questo')
  $scope.endTestMattressesReturnResult = function () {
    var dataMiddle = {
      weight: 0,
      height: 0,
      gender: $scope.sesso,
      pressurInterstData: []
    }

    var iteration = 0

    for (var s in $scope.testResult) {
      console.log('index s', s)
      for (var n in $scope.testResult[s]) {
        console.log('n', n)
        if (n !== 'infoPerson') {
          iteration++
          dataMiddle.weight += Number($scope.testResult[s][n].peso[5])
          console.log('iteration n', iteration)
          console.log('current weight', $scope.testResult[s][n].peso[5])
          console.log('dataMiddle.weight', dataMiddle.weight)
        }
      }
    }

    dataMiddle.height = Number($scope.testResult[0].infoPerson.height)

    if ($scope.testResult.length === 2) {
      dataMiddle.height += Number($scope.testResult[1].infoPerson.height)
      dataMiddle.height = dataMiddle.height / 2
    }

    console.log('iteration', iteration)
    dataMiddle.weight = String(Number(dataMiddle.weight) / iteration)
    console.log('dataMiddle.height', dataMiddle.height)
    console.log('dataMiddle.weight', dataMiddle.weight)
    var gcm3 = $scope.calculateLevel({
      'peso': dataMiddle.weight,
      'altezza': dataMiddle.height
    })
    var level = 0
    var mattressSuggestion = []
    // verifico che la prova sia eseguita come singolo o matrimoniale
    // primo if singolo (per ora ho forzato a true poi dipenderà da una varibile)
    if (true) {
      var step = 0
      console.log('prova singolo')
      for (var n in tableReferMat.singolo) {
        console.log('g/cm3 calcolati ', gcm3, 'g/cm3 min ', tableReferMat.singolo[n]['g/cm3'].min, 'g/cm3 max ', tableReferMat.singolo[n]['g/cm3'].max)
        if (tableReferMat.singolo[n]['g/cm3'].min < gcm3 && tableReferMat.singolo[n]['g/cm3'].max > gcm3) {
          level = tableReferMat.singolo[n]
          // for(var l = 0; l <= tableReferMat.singolo[n].materassi.length-1; l++){
          // mattressSuggestion[l].push(tableReferMat.singolo[n].materassi[l]);

          // }
          step = tableReferMat.singolo[n].step
          console.log(mattressSuggestion, 'moveDeg', String(tableReferMat.singolo[n].step), 'livello: ', tableReferMat.singolo[n].name)
          for (var l in tableReferMat.singolo[n].materassi) {
            mattressSuggestion.push(tableReferMat.singolo[n].materassi[l])
          }
          break
        }
      }
      currentObject.update('moveDeg', String(step))
      // secondo if matrimoniale (per ora ho forzato a false poi dipenderà da una varibile)
    } else if (false) { }
    console.log('mattressSuggestion', mattressSuggestion)
    $scope.selectedMattresses = mattressSuggestion
    return mattressSuggestion
    // return ["Nuvola", "Elisir", "Lady memory/Cover"];
  }
  $scope.personName = ''
  $scope.personSurname = ''
  $scope.personAge = null
  // Inizio Algoritmi PDF
  $scope.saveDataPDF = function () {
    console.log('ENTER IN PDF')
    var mattresses = []
    var m = $scope.endTestMattressesReturnResult()
    for (var n = 0; n <= m.length - 1; n++) {
      console.log('m', m, 'n', n)
      console.log('m[n]', m[n])
      var x1 = $scope.catalogue.find(function (x) {
        return x.model === m[n]
      })
      x1.renderer = 'mattresses.html'
      mattresses.push(JSON.parse(JSON.stringify(x1)))
    }
    $scope.mattresses = mattresses
    console.log('§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§')
    console.log('mattresses: ', mattresses)
    console.log('§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§')

    for (var s in $scope.testResult) {
      $scope.testResult[s]['mattresses'] = mattresses
    }

    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    console.log('$scope.testResult: ', $scope.testResult)
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')

    // var blob = new Blob([JSON.stringify($scope.testResult, null, 4)], {type : "application/json"});
    // var url = URL.createObjectURL(blob);
    // $window.open(url);
    $http.post('/apio/getPDF', {
      data: $scope.testResult,
      objectId: $scope.object.objectId
    }).then(function (response) {
      console.log('Got response: ', response)
      setTimeout(function(){
	      $scope.numTestDone = 1;
	      angular.element(document.getElementById('app')).scope().$apply()
      }, 5000)
      
    }, function (error) {
      console.log('Got error: ', error)
      $scope.numTestDone = 0
    })
  }
  // Fine Algoritmi PDF

  var tableLevelBar = [28.55, 42.3, 56.2, 68.9]

  $scope.verifyCorrectDataPosition = function () {
    console.log('*************************************')
    console.log("SONO NELL'IF")
    console.log('*************************************')

    $scope.testStepInterval = $scope.testStepInterval || setInterval(function () {
      console.log('$scope.testStepProgress Pre: ', $scope.testStepProgress)
      // $scope.testStepProgress += 3.5875;
      $scope.testStepProgress += 0.1
      console.log('############################')
      console.log('$scope.testStepProgress: ', $scope.testStepProgress)
      console.log('############################')
      console.log('°°°°°°°°°°°°°°°°°°°°°°°°°°°°')
      console.log('$scope.testStep: ', $scope.testStep)
      console.log('°°°°°°°°°°°°°°°°°°°°°°°°°°°°')
      console.log('$scope.testResult: ', $scope.testResult[$scope.stepTypeTest])
      if ($scope.testResult[$scope.stepTypeTest]['step' + Number(1 + $scope.testStep)].testLastMatrix.length < 10) {
        $scope.testResult[$scope.stepTypeTest]['step' + Number(1 + $scope.testStep)].testLastMatrix.push($scope.lastMatrixData)

        $scope.testResult[$scope.stepTypeTest]['step' + Number(1 + $scope.testStep)].lastProfileData.push($scope.lastProfileData)

        $scope.testResult[$scope.stepTypeTest]['step' + Number(1 + $scope.testStep)].peso.push($scope.peso)
      }
      console.log(' ******************** $scope.testResult = ', $scope.testResult[$scope.stepTypeTest])
      if ($scope.testStepProgress >= tableLevelBar[$scope.testStep]) {
        console.log(' ++++++++++++++++++++++++++++ dentro if clearInterval ++++++++++++++++++++++ ', $scope.testStep)

        if ($scope.typeTest === 'singolo' || $scope.stepTypeTest === 1) {
          $scope.testStep++
        } else if ($scope.testStep !== 2) {
          $scope.testStep++
        } else if ($scope.testStep === 2 && $scope.typeTest === 'coppia') {
          $scope.stepTypeTest = 1
          $scope.testResult.push({
            step1: {
              testLastMatrix: [],
              lastProfileData: [],
              peso: []
            },
            step2: {
              testLastMatrix: [],
              lastProfileData: [],
              peso: []
            },
            step3: {
              testLastMatrix: [],
              lastProfileData: [],
              peso: []
            },
            infoPerson: {}
          })
          $scope.resetTest()
        }
        if ($scope.testStep === 3) {
          $scope.stepTypeTest = 0
          $scope.testStepProgress = 68.9
          console.log('genero il PDF')
          $scope.saveDataPDF()
        }

        clearInterval($scope.testStepInterval)
        $scope.testStepInterval = null
      }
      $scope.$apply()
    }, 100)
  }

  var intervallQueueSendMaterassMove = {}
  intervallQueueSendMaterassMove.intervall = null
  intervallQueueSendMaterassMove.materasso = ''
  $scope.simulateRealMaterass = function (materasso) {
    console.log('go send')
    if ($scope.move === 0) {
      $scope.move = 1
      currentObject.update('materassi', materasso)
    } else if ($scope.move === 1) {
      if (intervallQueueSendMaterassMove.intervall === null) {
        intervallQueueSendMaterassMove.materasso = materasso
        console.log('intervallQueueSendMaterassMove', intervallQueueSendMaterassMove.materasso)
        intervallQueueSendMaterassMove.intervall = setInterval(function () {
          console.log('run iintervall', null)
          if ($scope.move === 0) {
            console.log('$scope.move == 0 intervallo cancellato')

            console.log('muovo il materasso')
            currentObject.update('materassi', intervallQueueSendMaterassMove.materasso)
            clearInterval(intervallQueueSendMaterassMove.intervall)
          }
        }, 3000)
        console.log('nuovo intervallo creato', intervallQueueSendMaterassMove)
        alert('Attendere prego! Il materasso è attualmente in movimento, al termine di questo verrà simulato il materasso selezionato.')
      } else {
        console.log('esiste già un intervall')
        // clearInterval(intervallQueueSendMaterassMove.intervall);
        intervallQueueSendMaterassMove.materasso = materasso
        console.log('materasso aggiornato')
        alert('Attendere prego! Il materasso è attualmente in movimento, al termine di questo verrà simulato il materasso selezionato.')
        // console.log("nuovo intervallo creato",intervallQueueSendMaterassMove);
      }
    }
    console.log('sended')
  }

  $scope.startTest = function () {
    // $mdDialog.hide();
    $scope.numTestDone = 0
    $scope.testStarted = true
    // $scope.testStep è la variabile utilizzata per la macchina a stati dell'utilizzo guidato del simulatore
    // 0 primo step
    // 1 secondo step
    // 2 terzo step
    // 3 quarto step
    // 4 reset
    $scope.testStep = 0
    $scope.testStepProgress = 14.55

    $scope.testResult[$scope.stepTypeTest].infoPerson = {
      name: $scope.personName,
      surname: $scope.personSurname,
      height: $scope.altezza,
      sex: $scope.sesso,
      age: $scope.personAge,
      addr: $scope.personAddr,
      city: $scope.personCity,
      cell: $scope.personCell,
      mail: $scope.personEmail,
      imc: $scope.imc
    }
    if ($scope.positionDetected === 2) {
      setTimeout(function () {
        // $scope.step1PositionOk = true;
        console.log('@@@@@@@@@@@@@@@@@@@@@@')
        console.log('SONO IN STARTTEST, $scope.testStepInterval VALE: ', $scope.testStepInterval)
        console.log('@@@@@@@@@@@@@@@@@@@@@@')
        $scope.verifyCorrectDataPosition()
        console.log('dentro WATCH positionDetected newValue = 2, $scope.step1PositionOk = ', $scope.step1PositionOk)
      }, 1300)
    }
  }

  /* Modal that show the report detail */
  $scope.reportModal = function () {
    $mdDialog.show({
      templateUrl: 'applications/' + $scope.object.objectId + '/modal/test_report_modal.tmpl.html',
      controller: ReportModalController,
      clickOutsideToClose: true,
      bindToController: true,
      // controllerAs: HomeController,
      scope: $scope,
      preserveScope: true,
      parent: angular.element(document.getElementById('targetBody')),
      // targetEvent: ev,
      fullscreen: true
    }).then(function (answer) {
      // console.log(" ---------- dentro al than ---------");
    }, function () {
      // console.log(" ---------- dentro al function ---------");
    })
  }

  function ReportModalController ($scope, $mdDialog) {
    $scope.hide = function () {
      $mdDialog.hide()
    }

    $scope.cancel = function () {
      $mdDialog.cancel()
    }

    $scope.answer = function (answer) {
      $mdDialog.hide(answer)
    }
  }

  /* Function that Send the Report by mail */
  $scope.mailSent = 0
  $scope.sendReportByMail = function () {
    console.log('$scope.personEmail = ', $scope.personEmail)

    $scope.mailSent = 1

    var subjectSexAbbr = ''
    if ($scope.sesso === 'uomo') {
      subjectSexAbbr = 'del Sig.'
    } else if ($scope.sesso === 'donna') {
      subjectSexAbbr = 'della Sig.ra'
    }

    $http.post('/apio/service/mail/send', {
      // name: $scope.personName,
      // surname: $scope.personSurname,
      attachments: [{
        filename: 'Scheda Comfort Test di ' + $scope.personName + ' ' + $scope.personSurname + '.pdf',
        path: './public/applications/12/PDF/scheda_cliente.pdf'
      }],
      mail: $scope.personEmail,
      subject: "ComfortTest LordFlex's: scheda " + subjectSexAbbr + ' ' + $scope.personSurname,
      text: 'Salve, di seguito alleghiamo il report del ComfortTest che lei ha effettuato. Per qualsiasi ulteriore informazioni non esiti a contattarci. Cordialmente.'
    }).then(function (response) {
      console.log('Mail inviata, response: ', response)
      $scope.mailSent = 2
      console.log('$scope.mailSent = ', $scope.mailSent)
      setTimeout(function () {
        $scope.mailSent = 0
        $scope.personEmail = ''
        $scope.$applyAsync()
        console.log('$scope.mailSent = ', $scope.mailSent)
        // $mdDialog.hide();
      }, 900)
    }, function (error) {
      console.log('Mail NON inviata, error: ', error)
      $scope.mailSent = 3
      console.log('$scope.mailSent = ', $scope.mailSent)
      setTimeout(function () {
        $scope.mailSent = 0
        $scope.$applyAsync()
        console.log('$scope.mailSent = ', $scope.mailSent)
        // $mdDialog.hide();
      }, 900)
    })
  }

  /* CATALOGUE functions and variables ----------------------------- */
  $scope.catalogue = [
    {
      model: 'Aniversario 50',
      name: 'Aniversario 50',
      positionMotor: '0',
      urlIcon: '/applications/' + $scope.object.objectId + '/img/catalogo50/aniversario50-min.png',
      urlDesktop: '/applications/' + $scope.object.objectId + '/img/schede/SCHEDA_ANNIVERSARIO50-min.jpg',
      urlMobile: '/applications/' + $scope.object.objectId + '/mattresses_img/schedeMobile/Nuvola.png'
    },
    {
      model: 'Elisir',
      name: 'Elisir',
      positionMotor: '1',
      urlIcon: '/applications/' + $scope.object.objectId + '/img/catalogo50/elisir-min.png',
      urlDesktop: '/applications/' + $scope.object.objectId + '/img/schede/SCHEDA_ELISIR-min.jpg',
      urlMobile: '/applications/' + $scope.object.objectId + '/mattresses_img/schedeMobile/Elisir.png'
    },
    {
      model: 'Lady Memory',
      name: 'Lady Memory',
      positionMotor: '2',
      urlIcon: '/applications/' + $scope.object.objectId + '/img/catalogo50/ladymemory-min.png',
      urlDesktop: '/applications/' + $scope.object.objectId + '/img/schede/SCHEDA_LADYMEMORY-min.jpg',
      urlMobile: '/applications/' + $scope.object.objectId + '/mattresses_img/schedeMobile/LadyMemory.png'
    },
    {
      model: 'Aquagel',
      name: 'Aquagel',
      positionMotor: '3',
      urlIcon: '/applications/' + $scope.object.objectId + '/img/catalogo50/aquagel-min.png',
      urlDesktop: '/applications/' + $scope.object.objectId + '/img/schede/SCHEDA_AQUAGEL-min.jpg',
      urlMobile: '/applications/' + $scope.object.objectId + '/mattresses_img/schedeMobile/Aquagel.png'
    },
    {
      model: 'Bliss',
      name: 'Bliss',
      positionMotor: '3',
      urlIcon: '/applications/' + $scope.object.objectId + '/img/catalogo50/bliss-min.png',
      urlDesktop: '/applications/' + $scope.object.objectId + '/img/schede/SCHEDA_BLISS-min.jpg',
      urlMobile: '/applications/' + $scope.object.objectId + '/mattresses_img/schedeMobile/Aquagel.png'
    },
    {
      model: 'Lady Soft',
      name: 'Lady Soft',
      positionMotor: '4',
      urlIcon: '/applications/' + $scope.object.objectId + '/img/catalogo50/ladysoft-min.png',
      urlDesktop: '/applications/' + $scope.object.objectId + '/img/schede/SCHEDA_LADYSOFT-min.jpg',
      urlMobile: '/applications/' + $scope.object.objectId + '/mattresses_img/schedeMobile/LadySoftZip.png'
    },
    {
      model: 'Melody/Bios crine zip',
      name: 'Melody',
      name2: 'Bios Crine Zip',
      positionMotor: '5',
      urlIcon: '/applications/' + $scope.object.objectId + '/img/catalogo50/melody_bios_crine_zip.png',
      urlDesktop: '/applications/' + $scope.object.objectId + '/img/schede/Melody.jpg',
      urlMobile: '/applications/' + $scope.object.objectId + '/mattresses_img/schedeMobile/Melody.png'
    },
    {
      model: 'Oblio MP',
      name: 'Oblio MP',
      positionMotor: '6',
      urlIcon: '/applications/' + $scope.object.objectId + '/img/catalogo50/oblio_mp.png',
      urlDesktop: '/applications/' + $scope.object.objectId + '/img/schede/SCHEDA_OBLIOAP-min.jpg',
      urlMobile: '/applications/' + $scope.object.objectId + '/mattresses_img/schedeMobile/OblioMP.png'
    },
    {
      model: 'Dormiglione',
      name: 'Dormiglione',
      positionMotor: '7',
      urlIcon: '/applications/' + $scope.object.objectId + '/img/catalogo50/dormiglione-min.png',
      urlDesktop: '/applications/' + $scope.object.objectId + '/img/schede/SCHEDA_DORMIGLIONE-min.jpg',
      urlMobile: '/applications/' + $scope.object.objectId + '/mattresses_img/schedeMobile/DormiglionePiu.png'
    },
    {
      model: 'Pixel',
      name: 'Pixel',
      positionMotor: '8',
      urlIcon: '/applications/' + $scope.object.objectId + '/img/catalogo50/pixel.png',
      urlDesktop: '/applications/' + $scope.object.objectId + '/img/schede/Pixel.jpg',
      urlMobile: '/applications/' + $scope.object.objectId + '/mattresses_img/schedeMobile/Pixel.png'
    },
    {
      model: 'Lady Più',
      name: 'Lady Più',
      name2: 'Lady Più',
      positionMotor: '9',
      urlIcon: '/applications/' + $scope.object.objectId + '/img/catalogo50/ladypiu-min.png',
      urlDesktop: '/applications/' + $scope.object.objectId + '/img/schede/SCHEDA_LADYPIU-min.jpg',
      urlMobile: '/applications/' + $scope.object.objectId + '/mattresses_img/schedeMobile/LadyPiuZip.png'
    },
    {
      model: 'Memory',
      name: 'Memory',
      positionMotor: '10',
      urlIcon: '/applications/' + $scope.object.objectId + '/img/catalogo50/memory-min.png',
      urlDesktop: '/applications/' + $scope.object.objectId + '/img/schede/SCHEDA_MEMORY-min.jpg',
      urlMobile: '/applications/' + $scope.object.objectId + '/mattresses_img/schedeMobile/Memory.png'
    },
    {
      model: 'Vanity',
      name: 'Vanity',
      positionMotor: '11',
      urlIcon: '/applications/' + $scope.object.objectId + '/img/catalogo50/vanity-min.png',
      urlDesktop: '/applications/' + $scope.object.objectId + '/img/schede/SCHEDA_VANITY-min.jpg',
      urlMobile: '/applications/' + $scope.object.objectId + '/mattresses_img/schedeMobile/Vanity.png'
    },
    {
      model: 'Brio',
      name: 'Brio',
      positionMotor: '12',
      urlIcon: '/applications/' + $scope.object.objectId + '/img/catalogo50/brio-min.png',
      urlDesktop: '/applications/' + $scope.object.objectId + '/img/schede/SCHEDA_BRIO-min.jpg',
      urlMobile: '/applications/' + $scope.object.objectId + '/mattresses_img/schedeMobile/Brio.png'
    },
    {
      model: 'Oblio AP',
      name: 'Oblio AP',
      positionMotor: '12',
      urlIcon: '/applications/' + $scope.object.objectId + '/img/catalogo50/oblio_ap-min.png',
      urlDesktop: '/applications/' + $scope.object.objectId + '/img/schede/SCHEDA_OBLIOAP-min.jpg',
      urlMobile: '/applications/' + $scope.object.objectId + '/mattresses_img/schedeMobile/Brio.png'
    },
    {
      model: 'Cover',
      name: 'Cover',
      positionMotor: '13',
      urlIcon: '/applications/' + $scope.object.objectId + '/img/catalogo50/cover-min.png',
      urlDesktop: '/applications/' + $scope.object.objectId + '/img/schede/SCHEDA_COVER-min.jpg',
      urlMobile: '/applications/' + $scope.object.objectId + '/mattresses_img/schedeMobile/Fitness.png'
    },
    {
      model: 'Strabilio',
      name: 'Strabilio',
      positionMotor: '13',
      urlIcon: '/applications/' + $scope.object.objectId + '/img/catalogo50/strabilio-min.png',
      urlDesktop: '/applications/' + $scope.object.objectId + '/img/schede/SCHEDA_STRABILIO-min.jpg',
      urlMobile: '/applications/' + $scope.object.objectId + '/mattresses_img/schedeMobile/Fitness.png'
    },
    {
      model: 'Oblio AP',
      name: 'Oblio AP',
      positionMotor: '13',
      urlIcon: '/applications/' + $scope.object.objectId + '/img/catalogo50/oblio_ap-min.png',
      urlDesktop: '/applications/' + $scope.object.objectId + '/img/schede/SCHEDA_OBLIOAP-min.jpg',
      urlMobile: '/applications/' + $scope.object.objectId + '/mattresses_img/schedeMobile/Fitness.png'
    },
    {
      model: 'Fitness',
      name: 'Fitness',
      positionMotor: '13',
      urlIcon: '/applications/' + $scope.object.objectId + '/img/catalogo50/fitness-min.png',
      urlDesktop: '/applications/' + $scope.object.objectId + '/img/schede/SCHEDA_FITNESS-min.jpg',
      urlMobile: '/applications/' + $scope.object.objectId + '/mattresses_img/schedeMobile/Fitness.png'
    }
  ]

  /* Modal that show mattress detail */
  $scope.mattressInfo = function (value) {
    console.log('matress', value)
    // $scope.simulateRealMaterass(value.positionMotor);
    // alert('');

    $mdDialog.show({
      locals: {
        value: value
      },
      templateUrl: 'applications/' + $scope.object.objectId + '/modal/mattresses_info.tmpl.html',
      controller: MattressInfoController,
      clickOutsideToClose: true,
      bindToController: true,
      // controllerAs: HomeController,
      scope: $scope,
      preserveScope: true,
      parent: angular.element(document.getElementById('targetBody')),
      // targetEvent: ev,
      fullscreen: true
    }).then(function (answer) {
      // console.log(" ---------- dentro al than ---------");
    }, function () {
      // console.log(" ---------- dentro al function ---------");
    })
  }

  function MattressInfoController ($scope, $mdDialog, value) {
    $scope.value = value
    // console.log("[Mattress details] value = ", $scope.value);

    $scope.twoMattressInfo = !!($scope.value.name2 && $scope.value.name2 !== '')
    $scope.mattressInfo1 = true
    $scope.mattressInfo2 = false
    $scope.showMattressInfo = function (num) {
      if (num === '2') {
        $scope.mattressInfo1 = false
        $scope.mattressInfo2 = true
      } else if (num === '1') {
        $scope.mattressInfo1 = true
        $scope.mattressInfo2 = false
      }
    }

    $scope.hide = function () {
      $mdDialog.hide()
    }

    $scope.cancel = function () {
      $mdDialog.cancel()
    }

    $scope.answer = function (answer) {
      $mdDialog.hide(answer)
    }
  }
}])

setTimeout(function () {
  angular.bootstrap(document.getElementById('ApioApplication12'), ['ApioApplication12'])
}, 10)
