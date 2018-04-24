var app = angular.module("ApioApplication12", ["apioProperty"]);
app.controller("defaultController", ["$scope", "currentObject", "$timeout", "$mdDialog", "$window", "$http", "$location", "socket", function ($scope, currentObject, $timeout, $mdDialog, $window, $http, $location, socket) {
    $scope.object = currentObject.get();
    console.log("Sono il defaultController e l'oggetto è: ", $scope.object);

    document.getElementById("ApioApplicationContainer").classList.add("fullscreen");

    //variabile che indica se il motore è in movimento
    $scope.move = 0;


    $scope.numTestDone = 0;

    //varibili utilizzati per il calcolo del migliore materasso, per la generazione del PDF e per la creazione delle grafiche SVG
    $scope.matrixHumanSvg = {};

    $scope.drawingOk = false;

    $scope.sesso = "uomo";
    $scope.altezza = 160;
    $scope.personName = "";
    $scope.personSurname = "";
    $scope.personAge = null;
    $scope.personEmail = "";

    $scope.lastMatrixRecive = 0;

    $scope.imc = 0;
    $scope.altezzaPercentuale = $scope.altezza - 100;

    $scope.tara = Number($scope.object.properties.tara.replace(",", "."));
    $scope.tolleranceLeftRight = 180;
    $scope.correzzioneMatrixSens = 7;
    var tolleranza = 0;
    $scope.azzeramentoTara = 0;
    $scope.peso = 0;

    $scope.peso1 = 0;
    $scope.peso2 = 0;
    $scope.peso3 = 0;
    $scope.peso4 = 0;

    $scope.tempPeso = 0;
    var myChart = undefined;
    var graph = undefined;
    var graph2d = undefined;
    var graph3d = undefined;

    var arrayTemplate = {
        numeroRighe: 14,
        numeroColonne: 7,
        pixelYStartPosition: 130,
        pixelXStartPosition: 270,
        distanceBetween: 17
    };

    var structureProfileData = {
        type: 'line',
        maintainAspectRatio: false,
        data: {
            labels: ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
            datasets: [
                {
                    label: "",
                    fill: true,
                    lineTension: 0.5,
                    backgroundColor: "#005597",
                    borderColor: "rgba(75,192,192,1)",
                    borderCapStyle: 'butt',
                    borderDash: [],
                    borderDashOffset: 0.0,
                    borderJoinStyle: 'miter',
                    pointBorderColor: "rgba(75,192,192,1)",
                    pointBackgroundColor: "#fff",
                    pointBorderWidth: 1,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: "rgba(75,192,192,1)",
                    pointHoverBorderColor: "rgba(220,220,220,1)",
                    pointHoverBorderWidth: 2,
                    pointRadius: 1,
                    pointHitRadius: 10,
                    data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -7],
                    spanGaps: true
                }
            ]
        }
    };

    var correzzione = [];
    var zMassimo = 1080;
    var activeCorrection = false;
    var massimo = 0;


    var arrayData = [];

    var rows = [];

    var generateData = function (ref) {
        // console.log('ref', ref);

        //--------------------
        // MATTEO
        rows = [];
        //--------------------

        var data = new vis.DataSet();
        var base = 0;
        var counter = 0;
        for (var x = 0; x < arrayTemplate.numeroRighe; x++) {
            for (var y = 0; y < arrayTemplate.numeroColonne; y++) {
                var value = 0;
                if (x % 2 === 0) {
                    if (y % 2 === 0) {
                        //console.log('colonna pari riga pari arrayData[counter] != undefined')
                        if (typeof ref[counter / 2] !== 'undefined' && Number(ref[counter / 2].replace(",", ".")) > tolleranza) {
                            value = Number(ref[counter / 2].replace(",", "."));
                        } else {
                            value = 0;
                        }
                        arrayData[counter] = {
                            x: x,
                            y: y,
                            z: -value
                            //style: Math.abs(value-zMassimo)
                        }
                    } else if (y % 2 !== 0) {
                        //console.log('colonna pari riga dipari arrayData[counter] != undefined')
                        var middle = [];
                        if (typeof ref[(counter - 1) / 2] !== 'undefined') {
                            middle.push(Number(ref[(counter - 1) / 2].replace(",", ".")));
                        }
                        if (typeof ref[(counter + 1) / 2] !== 'undefined') {
                            middle.push(Number(ref[(counter + 1) / 2].replace(",", ".")));
                        }
                        if (typeof ref[(counter - 7) / 2] !== 'undefined') {
                            middle.push(Number(ref[(counter - 7) / 2].replace(",", ".")));
                        }
                        if (typeof ref[(counter + 7) / 2] !== 'undefined') {
                            middle.push(Number(ref[(counter + 7) / 2].replace(",", ".")));
                        }
                        //console.log('middle 4',middle)
                        //console.log('counter',counter)
                        for (var s in middle) {
                            value += middle[s]
                        }

                        value = value / middle.length;


                        if (value < tolleranza) {
                            value = 0;
                        }


                        arrayData[counter] = {
                            x: x,
                            y: y,
                            z: -value
                            //style: Math.abs(value-zMassimo)
                        };
                    }
                } else {
                    if (y % 2 !== 0) {
                        if (typeof ref[counter / 2] !== 'undefined' && Number(ref[counter / 2].replace(",", ".")) > tolleranza) {
                            value = Number(ref[counter / 2].replace(",", "."));
                        } else {
                            value = 0;
                        }
                        arrayData[counter] = {
                            x: x,
                            y: y,
                            z: -value
                            //style: Math.abs(value-zMassimo)
                        }
                    } else if (y % 2 === 0) {
                        var middle = [];
                        if (counter % 7 === 0) {
                            if (typeof ref[(counter + 1) / 2] !== 'undefined') {
                                middle.push(Number(ref[(counter + 1) / 2].replace(",", ".")));
                            }
                        } else if (counter % 7 === 6) {
                            if (typeof ref[(counter - 1) / 2] !== 'undefined') {
                                middle.push(Number(ref[(counter - 1) / 2].replace(",", ".")));
                            }
                        }

                        if (typeof ref[(counter - 7) / 2] !== 'undefined') {
                            middle.push(Number(ref[(counter - 7) / 2].replace(",", ".")));
                        }
                        if (typeof ref[(counter + 7) / 2] !== 'undefined') {
                            middle.push(Number(ref[(counter + 7) / 2].replace(",", ".")));
                        }
                        //console.log('middle 3',middle)
                        //console.log('counter',counter)
                        //console.log('value',value);
                        for (var s in middle) {
                            value += middle[s]
                        }
                        value = value / middle.length;
                        if (value < tolleranza) {
                            value = 0;
                        }
                        arrayData[counter] = {
                            x: x,
                            y: y,
                            z: -value
                            //style: Math.abs(value-zMassimo)
                        };
                    }
                }

                //if(){
                /*data.add({
                 x: x,
                 y: y,
                 z: value,
                 style: value
                 });*/
                //}

                counter++;
            }
            if (x % 2 === 0) {
                base += 3;
            } else {
                base += 2;
            }
        }

        for (var s in arrayData) {
            //console.log('for di arrayData',s);
            //console.log('arrayData[s]',arrayData[s]);
            data.add(arrayData[s]);

            //++++++++++++++++++
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

            //x = indice array, y = key JSON, z = value JSON
            if (rows[Number(arrayData[s].x)] === undefined) {
                rows[Number(arrayData[s].x)] = {
                    "\"\"": String(Number(arrayData[s].x))
                };
            }

            rows[Number(arrayData[s].x)][String(Number(arrayData[s].y))] = String(Number(arrayData[s].z));

            //++++++++++++++++++
        }

        rows.sort(function (a, b) {
            return Number(a["\"\""]) - Number(b["\"\""]);
        });

        // console.log("arrayData: ", arrayData);
        // console.log("rows: ", rows);
        //console.log('arrayData',arrayData);
        //console.log('DATA!!!!!!!!',data)
        //counter = 0;

        return rows;
    };

    var unpack = function (rows, key) {
        return rows.map(function (row) {
            return row[key] || "0";
        });
    };


    var get2dData = function (data) {
        var data2d = [];
        for (var x in data) {
            var yCount = 0;
            var temp = {
                x: -Number(x)
            };

            for (var y in data[x]) {
                if (y !== "\"\"") {
                    if (temp.y === undefined) {
                        temp.y = Number(data[x][y]);
                    } else {
                        temp.y += Number(data[x][y]);
                    }
                    yCount++;
                }
            }

            temp.y /= yCount;

            data2d.push(temp);
        }

        var xMin, xMax;
        for (var h in data2d) {
            if (xMin === undefined || data2d[h].x < xMin) {
                xMin = data2d[h].x;
            }

            if (xMax === undefined || data2d[h].x > xMax) {
                xMax = data2d[h].x;
            }
        }

        for (var s = xMax + 1; s < xMax + 7; s++) {
            data2d.push({
                x: s,
                y: 0
            });
        }

        for (var e = xMin - 1; e >= xMin - 7; e--) {
            data2d.push({
                x: e,
                y: 0
            });
        }

        return data2d;
    };


    var generateCubeData = function (ref) {
        // console.log('ref', ref);

        var data = new vis.DataSet();
        var base = 0;
        var counter = 0;
        for (var x = 0; x < arrayTemplate.numeroRighe; x++) {
            for (var y = 0; y < arrayTemplate.numeroColonne; y++) {
                var value = 0;
                if (x % 2 === 0) {
                    if (y % 2 === 0) {
                        //console.log('colonna pari riga pari arrayData[counter] != undefined')
                        if (typeof ref[counter / 2] !== 'undefined' && Number(ref[counter / 2].replace(",", ".")) > tolleranza) {
                            value = Number(ref[counter / 2].replace(",", "."));
                        } else {
                            value = 0;
                        }
                        arrayData[counter] = {
                            x: -x,
                            y: -y,
                            z: -value
                            //style: Math.abs(value-zMassimo)
                        }
                    } else if (y % 2 !== 0) {
                        //console.log('colonna pari riga dipari arrayData[counter] != undefined')
                        var middle = [];
                        if (typeof ref[(counter - 1) / 2] !== 'undefined') {
                            middle.push(Number(ref[(counter - 1) / 2].replace(",", ".")));
                        }
                        if (typeof ref[(counter + 1) / 2] !== 'undefined') {
                            middle.push(Number(ref[(counter + 1) / 2].replace(",", ".")));
                        }
                        if (typeof ref[(counter - 7) / 2] !== 'undefined') {
                            middle.push(Number(ref[(counter - 7) / 2].replace(",", ".")));
                        }
                        if (typeof ref[(counter + 7) / 2] !== 'undefined') {
                            middle.push(Number(ref[(counter + 7) / 2].replace(",", ".")));
                        }
                        //console.log('middle 4',middle)
                        //console.log('counter',counter)
                        for (var s in middle) {
                            value += middle[s]
                        }

                        value = value / middle.length;
                        if (value < tolleranza) {
                            value = 0;
                        }
                        arrayData[counter] = {
                            x: -x,
                            y: -y,
                            z: -value
                            //style: Math.abs(value-zMassimo)
                        };
                    }
                } else {
                    if (y % 2 !== 0) {
                        if (typeof ref[counter / 2] !== 'undefined' && Number(ref[counter / 2].replace(",", ".")) > tolleranza) {
                            value = Number(ref[counter / 2].replace(",", "."));
                        } else {
                            value = 0;
                        }
                        arrayData[counter] = {
                            x: -x,
                            y: -y,
                            z: -value
                            //style: Math.abs(value-zMassimo)
                        }
                    } else if (y % 2 === 0) {
                        var middle = [];
                        if (counter % 7 === 0) {
                            if (typeof ref[(counter + 1) / 2] !== 'undefined') {
                                middle.push(Number(ref[(counter + 1) / 2].replace(",", ".")));
                            }
                        } else if (counter % 7 === 6) {
                            if (typeof ref[(counter - 1) / 2] !== 'undefined') {
                                middle.push(Number(ref[(counter - 1) / 2].replace(",", ".")));
                            }
                        }

                        if (typeof ref[(counter - 7) / 2] !== 'undefined') {
                            middle.push(Number(ref[(counter - 7) / 2].replace(",", ".")));
                        }
                        if (typeof ref[(counter + 7) / 2] !== 'undefined') {
                            middle.push(Number(ref[(counter + 7) / 2].replace(",", ".")));
                        }
                        //console.log('middle 3',middle)
                        //console.log('counter',counter)
                        //console.log('value',value);
                        for (var s in middle) {
                            value += middle[s]
                        }
                        value = value / middle.length;
                        if (value < tolleranza) {
                            value = 0;
                        }
                        arrayData[counter] = {
                            x: -x,
                            y: -y,
                            z: -value
                            //style: Math.abs(value-zMassimo)
                        };
                    }
                }

                //if(){
                /*data.add({
                 x: x,
                 y: y,
                 z: value,
                 style: value
                 });*/
                //}

                counter++;
            }
            if (x % 2 === 0) {
                base += 3;
            } else {
                base += 2;
            }
        }

        var media = 0;
        var pesiMedia = 0;
        for (var s in arrayData) {
            media += Number(arrayData[s].z);
            pesiMedia = s;
            //console.log("arrayData[s].z",arrayData[s].z);
            //console.log("media",media);
            //console.log("pesiMedia",pesiMedia);
            data.add(arrayData[s]);
        }

        //se non c'è nessuno sul materasso e prima non c'era nessuno
        if (Math.abs(media) / pesiMedia < 40 && $scope.azzeramentoTara === 0) {
            console.log('materasso libero faccio la tare');
            $scope.azzeramentoTara = 1;
            /*$scope.tara = $scope.peso;
             currentObject.update("tara", $scope.peso, true, false);*/
            //se non c'è nessuno sul materasso e ho già fatto la tara
        } else if (Math.abs(media) / pesiMedia < 40 && $scope.azzeramentoTara === 1) {



            //se c'è qualcuno sul materasso e ho già fatto la tara
        } else if (Math.abs(media) / pesiMedia > 40 && $scope.azzeramentoTara === 1) {
            console.log(' ce qualcuno');
            $scope.azzeramentoTara = 2
            //se non c'è nessuno sul materasso e prima c'era qualcuno
        }
        if (Math.abs(media) / pesiMedia < 40 && $scope.azzeramentoTara === 2) {
            console.log('materasso di nuovo libero');
            $scope.azzeramentoTara = 0;
        }

        return data;
    };

    var generateProfilData = function (array) {
        var profileArray = [];
        var rowNumber = 0;
        for (var s in array) {
            if (s === 0) {
                array[s] = 0;
            }
            //console.log("array[s]",array[s].z);
            if ((1 + Number(s)) % 7 === 0) {
                //console.log("verifica array",Number(s)-4,Number(s)-3,Number(s)-2)
                profileArray[13 - rowNumber] = (Number(array[Number(s) - 4].z) + Number(array[Number(s) - 3].z) + Number(array[Number(s) - 2].z)) / 3;
                rowNumber++;
            } else {
                /*if(array[s].z>array[Number(s)+1].z){

                 profileArray[13-rowNumber] = Number(array[s].z);
                 } else {
                 profileArray[13-rowNumber] = Number(array[Number(s)+1].z);
                 }*/
            }
            //console.log("1+Number(s))",1+Number(s));
            //console.log("row number",rowNumber);
        }

        $scope.lastProfileData = profileArray;
        //console.log("lastProfileData", $scope.lastProfileData);
        //console.log("lastProfileData", JSON.stringify($scope.lastProfileData));
        return profileArray;
    };


//QUESTA FUNZIONE SERVE PER GENERARE IL GRAFICO DELL'OMINO DI PROFILO
    var generateProfilGraph = function (pointArray) {

        var dataToSet = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        for (var s in pointArray) {
            //console.log("for generateProfilGraph ",pointArray[s]);
            if (pointArray[s] === 0) {
                dataToSet[4 + Number(s)] = pointArray[s];
            } else {
                dataToSet[5 + Number(s)] = ((-pointArray[s]) / $scope.correzzioneMatrixSens);
            }

        }

        //console.log("dataToSet", dataToSet);

        //structureProfileData.data.datasets[0].data = dataToSet;

        if (myChart) {
            myChart.data.datasets[0].data = dataToSet;
            //console.log("update new dataSet");
            myChart.updateDatasets();
            myChart.render(1, 1);
            //console.log("updated", myChart);


        }
    };

//QUESTA FUNZIONE SERVE PER NORMALIZZARE I DATI, RICOSTRUISCE IL VALORE DEI SENSORI MANCANTI PERTENDO DA QUELLI PRESENTI
    var normalizeData = function (ref) {
        // console.log('ref', ref);
        var base = 0;
        var counter = 0;

        var tempArrayData = [];

        //console.log("numero totale righe normalize", arrayTemplate.numeroRighe);
        //console.log("numero totale colonne normalize", arrayTemplate.numeroColonne);
        //if(Number($scope.peso) > 30){
        if (true) {
            for (var x = 0; x < arrayTemplate.numeroRighe; x++) {
                //console.log("riga normalize", x);

                for (var y = 0; y < arrayTemplate.numeroColonne; y++) {
                    //console.log("$scope.peso", $scope.peso);
                    //console.log("$scope.peso + tara", 30 + $scope.tara);
                    var value = 0;
                    if (x % 2 === 0) {
                        if (y % 2 === 0) {
                            //console.log('colonna pari riga pari tempArrayData[counter] != undefined')
                            if (typeof ref[counter / 2] !== 'undefined' && Number(ref[counter / 2].replace(",", ".")) > tolleranza) {
                                value = Number(ref[counter / 2].replace(",", "."));
                            } else {
                                value = 0;
                            }
                            tempArrayData[counter] = {
                                x: x,
                                y: y,
                                z: Math.abs(value)
                                //style: Math.abs(value-zMassimo)
                            }
                        } else if (y % 2 !== 0) {
                            //console.log('colonna pari riga dipari tempArrayData[counter] != undefined')
                            var middle = [];
                            if (typeof ref[(counter - 1) / 2] !== 'undefined') {
                                middle.push(Number(ref[(counter - 1) / 2].replace(",", ".")));
                            }
                            if (typeof ref[(counter + 1) / 2] !== 'undefined') {
                                middle.push(Number(ref[(counter + 1) / 2].replace(",", ".")));
                            }
                            if (typeof ref[(counter - 7) / 2] !== 'undefined') {
                                middle.push(Number(ref[(counter - 7) / 2].replace(",", ".")));
                            }
                            if (typeof ref[(counter + 7) / 2] !== 'undefined') {
                                middle.push(Number(ref[(counter + 7) / 2].replace(",", ".")));
                            }
                            //console.log('middle 4',middle)
                            //console.log('counter',counter)
                            for (var s in middle) {
                                value += middle[s]
                            }

                            value = value / middle.length;
                            if (value < tolleranza) {
                                value = 0;
                            }
                            tempArrayData[counter] = {
                                x: x,
                                y: y,
                                z: Math.abs(value)
                                //style: Math.abs(value-zMassimo)
                            };
                        }
                    }
                    else {
                        if (y % 2 !== 0) {
                            if (typeof ref[counter / 2] !== 'undefined' && Number(ref[counter / 2].replace(",", ".")) > tolleranza) {
                                value = Number(ref[counter / 2].replace(",", "."));
                            } else {
                                value = 0;
                            }
                            tempArrayData[counter] = {
                                x: x,
                                y: y,
                                z: Math.abs(value)
                                //style: Math.abs(value-zMassimo)
                            }
                        } else if (y % 2 === 0) {
                            var middle = [];
                            if (counter % 7 === 0) {
                                if (typeof ref[(counter + 1) / 2] !== 'undefined') {
                                    middle.push(Number(ref[(counter + 1) / 2].replace(",", ".")));
                                }
                            } else if (counter % 7 === 6) {
                                if (typeof ref[(counter - 1) / 2] !== 'undefined') {
                                    middle.push(Number(ref[(counter - 1) / 2].replace(",", ".")));
                                }
                            }

                            if (typeof ref[(counter - 7) / 2] !== 'undefined') {
                                middle.push(Number(ref[(counter - 7) / 2].replace(",", ".")));
                            }
                            if (typeof ref[(counter + 7) / 2] !== 'undefined') {
                                middle.push(Number(ref[(counter + 7) / 2].replace(",", ".")));
                            }
                            //console.log('middle 3',middle)
                            //console.log('counter',counter)
                            //console.log('value',value);
                            for (var s in middle) {
                                value += middle[s]
                            }
                            value = value / middle.length;
                            if (value < tolleranza) {
                                value = 0;
                            }
                            tempArrayData[counter] = {
                                x: x,
                                y: y,
                                z: Math.abs(value)
                                //style: Math.abs(value-zMassimo)
                            };
                        }
                    }


                    counter++;
                }
                //console.log('normalize return'/*,tempArrayData*/);

            }
            $scope.lastMatrixData = tempArrayData;
            //console.log("----------------- $scope.lastMatrixData = ", $scope.lastMatrixData);
            //alert($scope.lastMatrixData.toString())

            //console.log("data for report", JSON.stringify($scope.lastMatrixData));
            return tempArrayData;
        } else {
            //console.log("non c'è nessuno sul materasso metto tutto a zero");
            for (var x = 0; x < arrayTemplate.numeroRighe; x++) {
                for (var y = 0; y < arrayTemplate.numeroColonne; y++) {
                    tempArrayData[counter] = {
                        x: x,
                        y: y,
                        z: 0
                        //style: Math.abs(value-zMassimo)
                    }
                    counter++;
                }

            }
            $scope.lastMatrixData = tempArrayData;
            return tempArrayData;

        }
    };

//QUESTA FUNZIONE ANALIZZA I DATI PROVENIENTI DAI SENSORI DI POSTURA E RICONOSCE LA POSIZIONE SUPINA, SINISTRA O DESTRA
//INOLTRE LA FUNZIONE VIENE SFRUTTATA PER TARARE I SENSORI DI PESO QUANDO NESSUNO E' SUL MATERASSO 
    var detectHumanPositionOnTheBed = function (matrix) {
        //console.log("detected human position");
        //console.log(matrix);
        var position = "top";
        var thisRow = 1;
        var thisColl = 0;


        var leftIndex = 0;
        var rightIndex = 0;

        for (var s in matrix) {
            thisColl++;
            var n = s + 1;

            //console.log("colonna numero", thisColl);

            if (thisColl <= 3) {
                //console.log("sommo a sinistra");
                leftIndex = leftIndex + matrix[s].z;
            } else if (thisColl === 4) {
                //console.log("sommo a metà");
                leftIndex = leftIndex + matrix[s].z;
                rightIndex = rightIndex + matrix[s].z;
            } else if (thisColl > 4) {
                //console.log("sommo a destra");
                rightIndex = rightIndex + matrix[s].z;
            }

            //console.log("colonna valore", matrix[s].z);

            if (n % 7 === 0) {
                thisColl = 0;
                thisRow++;
            }
        }

        //console.log("left and right vale", leftIndex, rightIndex);
        if (leftIndex > rightIndex && Math.abs(leftIndex - rightIndex) > $scope.tolleranceLeftRight) {
            //console.log("sei a sinistra return 0");
            return 0;
        } else if (rightIndex > leftIndex && Math.abs(leftIndex - rightIndex) > $scope.tolleranceLeftRight) {
            //console.log("sei a destra return 1");
            return 1;
        } else if (rightIndex > 100 && rightIndex > 100) {
            //console.log("sei sul dorso return 2");
            return 2;
        } else if (rightIndex < 100 && rightIndex < 100) {
            return 3;
        }
    };

//QUESTA FUNZIONE GENERA IL GRAFICO DEI PALLINI SULLA SAGOMA SUPIO, SINISTRO, DESTRO
    var createSvgMatrixHumanGraph = function () {
        //console.log("devo generare una matrice di: " + arrayTemplate.numeroRighe + "righe e:" + arrayTemplate.numeroColonne + "colonne");
        var tempSvg = document.getElementById('sagomaInterattiva');
        for (var x = 0; x < arrayTemplate.numeroRighe; x++) {
            //console.log("genero righe svg", x);
            var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            g.setAttribute('id', 'riga' + (x + 1));
            tempSvg.appendChild(g);

            //calcolo posizione Y
            var cy = arrayTemplate.pixelYStartPosition + ( arrayTemplate.distanceBetween * x );
            $scope.matrixHumanSvg["\"" + x + "\""] = {};
            for (var y = 0; y < arrayTemplate.numeroColonne; y++) {

                //console.log("genero colonne svg", y)

                var value = 0;


                tempSvg.appendChild(g);

                //calcolo posizione x
                var cx = arrayTemplate.pixelXStartPosition + ( arrayTemplate.distanceBetween * y );

                var newCircle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
                newCircle.setAttribute('id', "elementMatrix" + (arrayTemplate.numeroRighe - 1 - x) + y);
                newCircle.setAttribute('cx', cx);
                newCircle.setAttribute('cy', cy);
                newCircle.setAttribute('r', 1);
                newCircle.setAttribute('stroke', 'green');
                newCircle.setAttribute('stroke-width', 1);
                newCircle.setAttribute('fill', 'yellow');
                g.appendChild(newCircle);


                $scope.matrixHumanSvg["\"" + x + "\""]["\"" + y + "\""] = {
                    r: 1,
                    stroke: 'green',
                    strokeWidth: 1,
                    fill: 'yellow'

                }

            }

        }
        //console.log('$scope.matrixHumanSvg' , $scope.matrixHumanSvg);
    };
	
	//funzione che aggiorna i pallini indice della pressione sulla sagoma
    var updateSvgMatrixHumanGraph = function (matrixUpdate) {

        var countRow = 0;
        var countColl = 0;
        var conunterTemp = 0;
        for (var s in matrixUpdate) {
            conunterTemp++;

            document.getElementById('elementMatrix' + countRow + countColl).setAttribute('r', matrixUpdate[s].z / $scope.correzzioneMatrixSens);
            //console.log("selezioni l'elemento: elementMatrix " + countRow + countColl);

            if (conunterTemp !== 0 && conunterTemp % 7 === 0) {
                countRow++;
                countColl = 0;
            } else {
                countColl++;
            }


        }
    };

    socket.on("apio_server_update", function (data) {
        //console.log("data",data);
        if (data.properties.hasOwnProperty("move")) {
            console.log("MOVE 0", data.properties.move);
            $scope.move = parseInt(data.properties.move);
        }
    });


    $scope.$watch("object.properties.pes", function (newValue) {
        //console.log("WATCH PES", newValue);
        var pesoTemp = 0;
        if (newValue && newValue.indexOf("|") > -1) {
            var z = newValue.split("|");
            //console.log("z prima",z)
            if (true) {
                for (var i = 0; i <= z.length - 2; i++) {

                    //console.log("z[i] prima elaborazione",z[i]);
                    //PRIMA DELLA NUOVA SCHEDA
                    /*
	                    
                    if (i === 0) {
                        $scope.peso1 = (((Number(z[i].replace(",",".")) / 2) * 5.5865020636) / 1000);
                        //console.log("peso sensore 1", $scope.peso1);
                    } else if (i === 1) {
                        $scope.peso2 = (((Number(z[i].replace(",",".")) / 2) * 5.5865020636) / 1000);

                        //console.log("peso sensore 2", $scope.peso2);
                    } else if (i === 2) {
                        $scope.peso3 = (((Number(z[i].replace(",",".")) / 2) * 5.5865020636) / 1000);
                        //console.log("peso sensore 3", $scope.peso3);
                    } else if (i === 3) {
                        $scope.peso4 = (((Number(z[i].replace(",",".")) / 2) * 5.5865020636) / 1000);
                        //console.log("peso sensore 4", $scope.peso4);
                    }
                    */

                    if (i === 0) {
                        $scope.peso1 = Number(z[i].replace(",", "."));
                        //console.log("peso sensore 1", $scope.peso1);
                    } else if (i === 1) {
                        $scope.peso2 = Number(z[i].replace(",", "."));

                        //console.log("peso sensore 2", $scope.peso2);
                    } else if (i === 2) {
                        $scope.peso3 = Number(z[i].replace(",", "."));
                        //console.log("peso sensore 3", $scope.peso3);
                    } else if (i === 3) {
                        $scope.peso4 = Number(z[i].replace(",", "."));
                        //console.log("peso sensore 4", $scope.peso4);
                    }

                }

                //$scope.peso2 = ($scope.peso1 + $scope.peso3 + $scope.peso4)/3;

                pesoTemp = $scope.peso1 + $scope.peso2 + $scope.peso3 + $scope.peso4;

                var positionDetected = detectHumanPositionOnTheBed($scope.lastMatrixRecive);
                if (positionDetected == 3 && pesoTemp < 120) {
                    //console.log("ESEGUO LA TARA! LA NUAVA TARA E' ", $scope.tara);
                    $scope.tara = pesoTemp;
                    currentObject.update("tara", String($scope.tara).replace(".", ","), true, false);
                } else {
                    //console.log("LA VECCHIA TARA E' ", $scope.tara);
                }
                pesoTemp = pesoTemp;
                //console.log("z[i] dopo elaborazione sommato", pesoTemp);
                if (!isNaN($scope.tara) && !isNaN($scope.peso)) {
                    //console.log('con tara', pesoTemp);
                    pesoTemp = pesoTemp - Number($scope.tara);
                } else {
                    //console.log('senza tara');
                    pesoTemp = pesoTemp;
                }
                $scope.peso = Math.abs(pesoTemp.toFixed(2));
                var tempImc = $scope.peso / (($scope.altezza / 100) * ($scope.altezza / 100));

                $scope.imc = tempImc.toFixed(2);
                //console.log('qudrato',($scope.altezza/100)*($scope.altezza/100))
                //console.log("IMC", $scope.imc)
            }
        }
    });


	//ricevo i dati della matrice di sensori sul materasso
	$scope.$watch("object.properties.mat", function (newValue) {
        //console.log("WATCH MAT::::", newValue);
        if (newValue && newValue.indexOf("|") > -1) {
            //console.log("newValue is true");
            if (/*graph && graph2d && graph3d*/ $scope.drawingOk) {
                var z = newValue.split("|");

                //INIZIO NUOVA PARTE SVG
                var dataHumanMatrix = normalizeData(z);
                $scope.lastMatrixRecive = dataHumanMatrix;
                //console.log("dataHumanMatrix = ", dataHumanMatrix);

                var positionDetected = $scope.positionDetected = detectHumanPositionOnTheBed(dataHumanMatrix);
                //console.log("------- positionDetected = ", positionDetected);
                //console.log("------- $scope.positionDetected = ", $scope.positionDetected);

                var profileData = generateProfilData(dataHumanMatrix);
                generateProfilGraph(profileData);

                var sagomaBackground = document.getElementById('sagomaManichino');
                var profiloBackground = document.getElementById('profilo');
                if (positionDetected === 0) {
                    /* posizione fetale destra */
                    sagomaBackground.classList.remove('sagomaLeft');
                    sagomaBackground.classList.add('sagomaRight');

                    profiloBackground.classList.remove('prfiloFrontale');
                    profiloBackground.classList.add('prfiloLaterale');
                } else if (positionDetected === 1) {
                    /* posizione fetale sinistra */
                    sagomaBackground.classList.add('sagomaLeft');
                    sagomaBackground.classList.remove('sagomaRight');

                    profiloBackground.classList.remove('prfiloFrontale');
                    profiloBackground.classList.add('prfiloLaterale');

                } else if (positionDetected === 2 || positionDetected === 3) {
                    /* posizione supina */
                    sagomaBackground.classList.remove('sagomaRight');
                    sagomaBackground.classList.remove('sagomaLeft');

                    profiloBackground.classList.remove('prfiloLaterale');
                    profiloBackground.classList.add('prfiloFrontale');

                }
                updateSvgMatrixHumanGraph(dataHumanMatrix);
                //FINE NUOVA PARTE SVG


                //console.log("call generateCubeData");
            } else {

            }
        }
    });

    $timeout(function () {
        //INIZIO NUOVO SVG SAGOMA
        createSvgMatrixHumanGraph();
        $scope.drawingOk = true;
        //FINE NUOVO SVG SAGOMA
        setTimeout(function () {

            //var z = newValue.split("|");
            var z = ["199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199", "199"];
            //console.log("z prima",z)
            /*for(var i = 0;i<=z.length; i++){
             if(Number(z[i]) > 150){
             z[i] = String(Number(z[i]) - correzzione);
             }
             }*/
            massimo = parseInt(z[0]);
            for (var i = 0; i <= z.length - 2; i++) {
                //console.log("Correggo!!!!!")
                //console.log("z[i]",z[i]);
                // console.log("z[i+1]",z[i+1]);
                correzzione.push(parseInt(z[i]));
                //z[i] = String(Number(z[i]) - correzzione[i]);
                if (z[i + 1] !== "NaN" && parseInt(z[i]) >= massimo) {
                    massimo = parseInt(z[i]);
                }

                //console.log("massimo",massimo);
            }

            //console.log("correzzione da eseguire",correzzione)

            //console.log("z dopo",z)


            var elem = document.getElementsByClassName("topAppApplication")[0];
            if (elem) {
                //clearInterval(interval);
                var data = generateData(z);
                var data2d = get2dData(data);
                var data3d = generateCubeData(z);

                var xMax, yMax, xMin, yMin;
                for (var x in data) {
                    if (xMin === undefined || Number(data[x]["\"\""]) < Number(xMin)) {
                        xMin = data[x]["\"\""];
                    }

                    if (xMax === undefined || Number(data[x]["\"\""]) > Number(xMax)) {
                        xMax = data[x]["\"\""];
                    }

                    for (var y in data[x]) {
                        if (y !== "\"\"") {
                            if (yMin === undefined || Number(y) < Number(yMin)) {
                                yMin = y;
                            }

                            if (yMax === undefined || Number(y) > Number(yMax)) {
                                yMax = y;
                            }
                        }
                    }
                }

                var z_data = [];
                for (var i = 0; i < data.length; i++) {
                    z_data.push(unpack(data, i));
                }

                var data = [{
                    reversescale: true,
                    showlegend: false,
                    showscale: false,
                    type: "surface",
                    z: z_data
                }];

                var layout = {
                    autosize: false,
                    height: (window.innerHeight - elem.offsetHeight - 10) / 2,
                    margin: {
                        l: 0,
                        b: 0,
                        r: 0,
                        t: 0
                    },
                    paper_bgcolor: "rgba(0,0,0,0)",
                    plot_bgcolor: "rgba(0,0,0,0)",
                    scene: {
                        aspectmode: "manual",
                        aspectratio: {
                            x: 1,
                            y: yMax / xMax,
                            z: 0.25
                        },
                        camera: {
                            eye: {
                                x: 0.7,
                                y: 0.7,
                                z: 0.7
                            }
                        },
                        xaxis: {
                            range: [xMin, xMax],
                            showgrid: false,
                            showline: false,
                            showticklabels: false,
                            title: "",
                            zeroline: false
                        },
                        yaxis: {
                            range: [yMin, yMax],
                            showgrid: false,
                            showline: false,
                            showticklabels: false,
                            title: "",
                            zeroline: false
                        },
                        zaxis: {
                            showgrid: false,
                            showline: false,
                            showticklabels: false,
                            title: "",
                            zeroline: false
                        }
                    },
                    width: window.innerWidth / 2
                };
                setTimeout(function () {
                    //Plotly.newPlot("graph", data, layout);
                }, 500);


                graph = document.getElementById("graph");

                var container = document.getElementById("graph2d");
                //var dataset = new vis.DataSet(data2d);
                var options = {
                    dataAxis: {
                        left: {
                            range: {min: -1000, max: 10}
                        },
                        visible: false
                    },
                    drawPoints: {
                        size: 0,
                        style: "circle"
                    },
                    height: (window.innerHeight - elem.offsetHeight - 10) / 2,
                    width: window.innerWidth / 2
                };

                setTimeout(function () {
                    //graph2d = new vis.Graph2d(container, dataset, options);
                }, 2000);

                var textElements = document.querySelectorAll(".vis-text");
                for (var e in textElements) {
                    if (textElements[e] && textElements[e].style) {
                        textElements[e].style.color = "rgba(246, 245, 245, 1)";
                    }
                }

                var OPTIONS = {
                    tooltip: true,
                    width: (window.innerWidth / 2) + "px",
                    //height: ((window.innerHeight - elem.offsetHeight - 10)) + "px",
                    //height: ((window.innerHeight - elem.offsetHeight - 10))/2 + "px",
                    height: ((window.innerHeight - elem.offsetHeight - 160)) + "px",
                    style: "surface",
                    animationPreload: true,
                    animationAutoStart: true,
                    showPerspective: true,
                    showGrid: false,
                    keepAspectRatio: true,
                    verticalRatio: 0.13,
                    zMax: 1023,
                    cameraPosition: {horizontal: 1.5 * Math.PI, vertical: 0.5 * Math.PI, distance: 2.6},
                    //backgroundColor: {fill: 'white', stroke: 'gray', strokeWidth: 1},
                    dataColor: {fill: '#ffffff', stroke: '#ffffff', strokeWidth: 1},
                    axisColor: "#f6f5f5",
                    zMin: -100
                };

                var CONTAINER = document.getElementById("graph3d");
                setTimeout(function () {
                    //GRAFICO 3D A CUBI
                    //graph3d = new vis.Graph3d(CONTAINER, data3d, OPTIONS);
                    $scope.drawingOk = true;
                }, 1000)


            }


            var ctx = document.getElementById("graficoProfilo");
            myChart = new Chart(ctx, structureProfileData);
            //console.log("myChart", myChart);
            // console.log("graph.data: ", graph.data);
            // console.log("z_data: ", z_data);

            // var options = {
            //     tooltip: true,
            //     width: "100%",
            //     height: "570px",
            //     //style: "bar",
            //     style: "surface",
            //     animationPreload: true,
            //     animationAutoStart: true,
            //     showPerspective: true,
            //     showGrid: false,
            //     //showShadow: true,
            //     keepAspectRatio: true,
            //     verticalRatio: 0.13,
            //     zMax: 1023,
            //     axisColor: "#f6f5f5",
            //     zMin: -100
            // };
            //
            // var container = document.getElementById("graph");
            // //graph = new vis.Graph3d(container, Number(data)-correzzione, options);
            // graph = new vis.Graph3d(container, data, options);

        }, 1000);
    }, 0);


    /* Person Config functions and variables ----------------------------- */
    /* Modal that enable to change the person configuration */
    $scope.personConfigModal = function () {
        $mdDialog.show({
            templateUrl: "applications/" + $scope.object.objectId + "/modal/person_config_modal.tmpl.html",
            controller: PersonConfigModalController,
            clickOutsideToClose: true,
            bindToController: true,
            //controllerAs: HomeController,
            scope: $scope,
            preserveScope: true,
            parent: angular.element(document.getElementById("targetBody")),
            //targetEvent: ev,
            fullscreen: true
        }).then(function (answer) {
            //console.log(" ---------- dentro al than ---------");
        }, function () {
            //console.log(" ---------- dentro al function ---------");
        });
    };

    function PersonConfigModalController($scope, $mdDialog) {

        $scope.hide = function () {
            $mdDialog.hide();
        };

        $scope.cancel = function () {
            $mdDialog.cancel();
        };

        $scope.answer = function (answer) {
            $mdDialog.hide(answer);
        };
    }

    /* WIZARD functions and variables ----------------------------- */
    $scope.resetTest = function () {
        currentObject.update("reset", "0");
        $scope.selectedMattresses = [];
        $scope.testStarted = false;
        $scope.sagomaBorderYellow = false;
        $scope.sagomaBorderGreen = false;

        $scope.testStep = 0;
        $scope.testStepProgress = 0;
        console.log("reset");

    };
    $scope.resetTest();

    $scope.testResult = {
        step1: [],
        step2: [],
        step3: []
    };


    //console.log("++++++++++++ $scope.testResult = ", $scope.testResult);
	
	
	//se viene rilevata una posizione e il test è partito allora inizio l'acquisizione dei dati in base allo step in cui mi trovo
	//
    $scope.$watch("positionDetected", function (newValue, oldValue) {
        console.log("WATCH positionDetected newValue = ", newValue);
        console.log("WATCH positionDetected oldValue = ", oldValue);
        if ($scope.testStarted) {
            if (newValue === 2 && $scope.testStep === 0) {
                setTimeout(function () {
                    console.log("@@@@@@@@@@@@@@@@@@@@@@");
                    console.log("SONO NEL WATCH CASO 1, $scope.testStepInterval VALE: ", $scope.testStepInterval);
                    console.log("@@@@@@@@@@@@@@@@@@@@@@");
                    $scope.verifyCorrectDataPosition();
                    console.log("acquisisco dati supino");
                    $scope.sagomaBorderYellow = false;
                    $scope.sagomaBorderGreen = true;
                    $scope.$applyAsync();
                }, 1300);
            } else if (newValue === 0 && $scope.testStep === 2) {
                setTimeout(function () {
                    console.log("@@@@@@@@@@@@@@@@@@@@@@");
                    console.log("SONO NEL WATCH CASO 2, $scope.testStepInterval VALE: ", $scope.testStepInterval);
                    console.log("@@@@@@@@@@@@@@@@@@@@@@");
                    $scope.verifyCorrectDataPosition();
                    console.log("acquisisco dati sinistra");
                    $scope.sagomaBorderYellow = false;
                    $scope.sagomaBorderGreen = true;
                    $scope.$applyAsync();
                }, 1300);
            } else if (newValue === 1 && $scope.testStep === 1) {
                setTimeout(function () {
                    console.log("@@@@@@@@@@@@@@@@@@@@@@");
                    console.log("SONO NEL WATCH CASO 3, $scope.testStepInterval VALE: ", $scope.testStepInterval);
                    console.log("@@@@@@@@@@@@@@@@@@@@@@");
                    $scope.verifyCorrectDataPosition();
                    console.log("acquisisco dati destra");
                    $scope.sagomaBorderYellow = false;
                    $scope.sagomaBorderGreen = true;
                    $scope.$applyAsync();
                }, 1300);
            } else {
                //console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
                //console.log("SONO NELL'ELSE");
                //console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
                clearInterval($scope.testStepInterval);
                $scope.testStepInterval = null;
                $scope.testStepProgress = 0;
                $scope.testResult['step' + Number(1 + $scope.testStep)] = [];

                $scope.sagomaBorderYellow = true;
                $scope.sagomaBorderGreen = false;
            }
        }
    });
    
    $scope.personName = "";
    $scope.personSurname = "";
    $scope.personAge = null;
    
    var tableReferMat = {
	    "singolo" : {
		    "livello1" : {
			    "g/cm3" : {
				    "min" : 9.114654304,
				    "max" : 10.11009634
			    },
			    "name" : "livello 1",
			    "materassi" : ['Vanity'],
			    "step" : 25
		    },
		    "livello2" : {
			    "g/cm3" : {
				    "min" : 10.11009635,
				    "max" : 11.10553838
			    },
			    "name" : "livello 2",
			    "materassi" : ['Bliss','Aquagel'],
			    "step" : 90
		    },
		    "livello3" : {
			    "g/cm3" : {
				    "min" : 11.10553839,
				    "max" : 12.10098042
			    },
			    "name" : "livello 3",
			    "materassi" : ['Lady Soft','Memory'],
			    "step" : 150
		    },
		    "livello4" : {
			    "g/cm3" : {
				    "min" : 12.10098043,
				    "max" : 13.09642246
			    },
			    "name" : "livello 4",
			    "materassi" : ['Lady Memory'],
			    "step" : 258
		    },
		    "livello5" : {
			    "g/cm3" : {
				    "min" : 13.09642247,
				    "max" : 18
			    },
			    "name" : "livello 5",
			    "materassi" : ['Dormiglione'],
			    "step" : 380
		    }
		},
		"matrimoniale" : {
			
		}
    }
    $scope.calculateLevel = function(data){
	    console.log('calculateLevel!!',data);
	    var mosteller = Math.sqrt((data.peso*(data.altezza/3600)));
	    console.log('mosteller = ',mosteller);
	    var supInfCorpo = mosteller/3;
	    console.log('supInfCorpo',supInfCorpo)
	    var forzaPeso = data.peso*9.81;
	    console.log('forzaPeso',forzaPeso)
	    var pressionePA =  forzaPeso/supInfCorpo;
	    console.log('pressionePA',pressionePA)
	    var pressioneGCM3 = pressionePA/98.1;
	    console.log('pressioneGCM3',pressioneGCM3)
	    return pressioneGCM3;
    }
    
	//alert('prova che è questo')
    $scope.endTestMattressesReturnResult = function () {
        var dataUno = [
            {
                customerCare: {
                    weight: $scope.peso,
                    height: $scope.altezza,
                    gender: $scope.sesso,
                    imc: $scope.imc,
                    position: "front"
                },
                positionDetected: 2,
                description: 0,
                lastMatrix: $scope.testResult.step1[3].testLastMatrix,
                lastProfile: $scope.testResult.step1[3].testLastProfile
            },
            {
                customerCare: {
                    weight: $scope.peso,
                    height: $scope.altezza,
                    gender: $scope.sesso,
                    imc: $scope.imc,
                    position: "front"
                },
                positionDetected: 1,
                description: 0,
                lastMatrix: $scope.testResult.step2[3].testLastMatrix,
                lastProfile: $scope.testResult.step2[3].testLastProfile
            },
            {
                customerCare: {
                    weight: $scope.peso,
                    height: $scope.altezza,
                    gender: $scope.sesso,
                    imc: $scope.imc,
                    position: "front"
                },
                positionDetected: 0,
                description: 0,
                lastMatrix: $scope.testResult.step3[3].testLastMatrix,
                lastProfile: $scope.testResult.step3[3].testLastProfile
            },
            {
                name: $scope.personName,
                surname: $scope.personSurname,
                age: $scope.personAge,
                weight: $scope.peso,
                height: $scope.altezza,
                gender: $scope.sesso,
                imc: $scope.imc,
                renderer: "intro.html"
            }
        ];
        var dataMiddle = {
            weight: 0,
            height: $scope.altezza,
            gender: $scope.sesso,
            pressurInterstData: []
        };
        for (var s in dataUno) {
            if (dataUno[s].hasOwnProperty('customerCare')) {
                dataMiddle.weight += Number(dataUno[s].customerCare.weight);
                console.log("index", s);
                console.log("current weight", dataUno[s].customerCare.weight);
                console.log("dataMiddle.weight", dataMiddle.weight);
            }
        }
        dataMiddle.weight = String(Number(dataMiddle.weight) / 3);
        console.log("dataMiddle.weight", dataMiddle.weight);
		var gcm3 = $scope.calculateLevel({
			'peso' : (dataMiddle.weight-3),
			'altezza' :  dataMiddle.height
		})
		var level = 0;
        var mattressSuggestion = [];
        //verifico che la prova sia eseguita come singolo o matrimoniale
        //primo if singolo (per ora ho forzato a true poi dipenderà da una varibile)
        if(true){
	        var step = 0;
	        console.log('prova singolo');
	        for(var n in tableReferMat.singolo){
		        console.log('g/cm3 calcolati ',gcm3,'g/cm3 min ',tableReferMat.singolo[n]["g/cm3"].min,'g/cm3 max ',tableReferMat.singolo[n]["g/cm3"].max);
		        if(tableReferMat.singolo[n]["g/cm3"].min < gcm3 && tableReferMat.singolo[n]["g/cm3"].max > gcm3){
			        level = tableReferMat.singolo[n]
			        //for(var l = 0; l <= tableReferMat.singolo[n].materassi.length-1; l++){
				        //mattressSuggestion[l].push(tableReferMat.singolo[n].materassi[l]);
				        
			        //}
			        step = tableReferMat.singolo[n].step
			        console.log( mattressSuggestion,"moveDeg", String(tableReferMat.singolo[n].step), 'livello: ',tableReferMat.singolo[n].name);
				    for(var l in tableReferMat.singolo[n].materassi){
					    mattressSuggestion.push(tableReferMat.singolo[n].materassi[l]);
				    }
			        break;
		        }
	        }
	        currentObject.update("moveDeg", String(step));
	    //secondo if matrimoniale (per ora ho forzato a false poi dipenderà da una varibile)
        } else if(false){}
        console.log("mattressSuggestion", mattressSuggestion);
        $scope.selectedMattresses = mattressSuggestion;
        return mattressSuggestion;
        //return ["Nuvola", "Elisir", "Lady memory/Cover"];
    };
    $scope.personName = "";
    $scope.personSurname = "";
    $scope.personAge = null;
	//Inizio Algoritmi PDF 
    $scope.saveDataPDF = function () {
        console.log("ENTER IN PDF");
        var mattresses = [];
        var m = $scope.endTestMattressesReturnResult();   
        for(var n = 0; n <= m.length-1; n++){
	        console.log('m',m,'n',n);
	        console.log('m[n]',m[n]);
	        var x1 = $scope.catalogue.find(function (x) {
            	return x.model === m[n];
			});
			x1.renderer = "mattresses.html";
            mattresses.push(JSON.parse(JSON.stringify(x1)));
        }
        console.log("§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§");
        console.log("mattresses: ", mattresses);
        console.log("§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§");
        var data = {
            objectId: $scope.object.objectId,
            data: [
                {
                    weight: $scope.peso,
                    height: $scope.altezza,
                    gender: $scope.sesso,
                    imc: $scope.imc,
                    name: $scope.personName,
                    surname: $scope.personSurname,
                    age: $scope.personAge,
                    renderer: "intro.html"
                },
                {
                    customerCare: {
                        weight: $scope.peso,
                        height: $scope.altezza,
                        gender: $scope.sesso,
                        imc: $scope.imc,
                        position: "front",
                        name: $scope.personName,
                        surname: $scope.personSurname,
                        age: $scope.personAge
                    },
                    positionDetected: 2,
                    description: 0,
                    lastMatrix: $scope.testResult.step1[3].testLastMatrix,
                    lastProfile: $scope.testResult.step1[3].testLastProfile
                },
                {
                    customerCare: {
                        weight: $scope.peso,
                        height: $scope.altezza,
                        gender: $scope.sesso,
                        imc: $scope.imc,
                        position: "front",
                        name: $scope.personName,
                        surname: $scope.personSurname,
                        age: $scope.personAge
                    },
                    positionDetected: 1,
                    description: 0,
                    lastMatrix: $scope.testResult.step2[3].testLastMatrix,
                    lastProfile: $scope.testResult.step2[3].testLastProfile
                },
                {
                    customerCare: {
                        weight: $scope.peso,
                        height: $scope.altezza,
                        gender: $scope.sesso,
                        imc: $scope.imc,
                        position: "front",
                        name: $scope.personName,
                        surname: $scope.personSurname,
                        age: $scope.personAge
                    },
                    positionDetected: 0,
                    description: 0,
                    lastMatrix: $scope.testResult.step3[3].testLastMatrix,
                    lastProfile: $scope.testResult.step3[3].testLastProfile
                }
            ]
        };
        data.data = data.data.concat(mattresses);
        console.log("send to PDF root: ", data);
        var blob = new Blob([JSON.stringify(data, null, 4)], {type : "application/json"});
        var url = URL.createObjectURL(blob);
        $window.open(url);
        $http.post("/apio/getPDF", data).then(function (response) {
        // $http({
        //     method: "POST",
        //     url: "/apio/getPDF",
        //     data: data,
        //     timeout: 1000 * 60 * 10
        // }).then(function (response) {
            console.log("Got response: ", response);
            //$window.open("http://" + $location.host() + ":" + $location.port() + "/applications/" + $scope.object.objectId + "/PDF/scheda_cliente.pdf");
            $scope.numTestDone = 1;
        }, function (error) {
            console.log("Got error: ", error);
            $scope.numTestDone = 0;
        });
    };
    $scope.verifyCorrectDataPosition = function () {
        console.log("*************************************");
        console.log("SONO NELL'IF");
        console.log("*************************************");

        $scope.testStepInterval = $scope.testStepInterval || setInterval(function () {
            console.log("$scope.testStepProgress Pre: ", $scope.testStepProgress);
            $scope.testStepProgress += 19;
            console.log("############################");
            console.log("$scope.testStepProgress: ", $scope.testStepProgress);
            console.log("############################");
            console.log("°°°°°°°°°°°°°°°°°°°°°°°°°°°°");
            console.log("$scope.testStep: ", $scope.testStep);
            console.log("°°°°°°°°°°°°°°°°°°°°°°°°°°°°");
            console.log("$scope.testResult: ", $scope.testResult);
            $scope.testResult['step' + Number(1 + $scope.testStep)].push({
                testLastMatrix: $scope.lastMatrixData,
                testLastProfile: $scope.lastProfileData
            });
            console.log(" ******************** $scope.testResult = ", $scope.testResult);
            if ($scope.testStepProgress >= 100) {

                console.log(" ++++++++++++++++++++++++++++ dentro if clearInterval ++++++++++++++++++++++ ", $scope.testStep);
                $scope.testStep++;
                $scope.sagomaBorderYellow = true;
                $scope.sagomaBorderGreen = false;
                if ($scope.testStep === 3) {

                    $scope.sagomaBorderYellow = false;
                    $scope.sagomaBorderGreen = false;
                    //$scope.numTestDone++;
                    console.log("genero il PDF");
                    //$scope.selectedMattresses = $scope.endTestMattressesReturnResult();
                    //$scope.selectedMattresses = ["Nuvola", "Elisir", "Lady memory/Cover"];
                    $scope.saveDataPDF();
                }

                clearInterval($scope.testStepInterval);
                $scope.testStepProgress = 0;
                $scope.testStepInterval = null;
            }
        }, 1000);

    };
	//Fine Algoritmi PDF
	
    var intervallQueueSendMaterassMove = {};
    intervallQueueSendMaterassMove.intervall = null;
    intervallQueueSendMaterassMove.materasso = "";
    $scope.simulateRealMaterass = function (materasso) {
        console.log("go send");
        if ($scope.move === 0) {
            $scope.move = 1;
            currentObject.update("materassi", materasso);
        } else if ($scope.move === 1) {
            if (intervallQueueSendMaterassMove.intervall === null) {
                intervallQueueSendMaterassMove.materasso = materasso;
                console.log("intervallQueueSendMaterassMove", intervallQueueSendMaterassMove.materasso);
                intervallQueueSendMaterassMove.intervall = setInterval(function () {
                    console.log("run iintervall", null);
                    if ($scope.move === 0) {
                        console.log("$scope.move == 0 intervallo cancellato");

                        console.log("muovo il materasso");
                        currentObject.update("materassi", intervallQueueSendMaterassMove.materasso);
                        clearInterval(intervallQueueSendMaterassMove.intervall);
                    }
                }, 3000);
                console.log("nuovo intervallo creato", intervallQueueSendMaterassMove);
                alert('Attendere prego! Il materasso è attualmente in movimento, al termine di questo verrà simulato il materasso selezionato.')
            } else {
                console.log("esiste già un intervall");
                //clearInterval(intervallQueueSendMaterassMove.intervall);
                intervallQueueSendMaterassMove.materasso = materasso;
                console.log("materasso aggiornato");
                alert('Attendere prego! Il materasso è attualmente in movimento, al termine di questo verrà simulato il materasso selezionato.')
                //console.log("nuovo intervallo creato",intervallQueueSendMaterassMove);
            }
        }
        console.log("sended");
    };


    $scope.startTest = function () {
        $mdDialog.hide();
        $scope.numTestDone = 0;
        $scope.testStarted = true;
        //$scope.testStep è la variabile utilizzata per la macchina a stati dell'utilizzo guidato del simulatore
        //0 primo step
        //1 secondo step
        //2 terzo step
        //3 quarto step
        //4 reset
        $scope.testStep = 0;
        $scope.sagomaBorderYellow = true;

        if ($scope.positionDetected === 2) {
            setTimeout(function () {
                //$scope.step1PositionOk = true;
                console.log("@@@@@@@@@@@@@@@@@@@@@@");
                console.log("SONO IN STARTTEST, $scope.testStepInterval VALE: ", $scope.testStepInterval);
                console.log("@@@@@@@@@@@@@@@@@@@@@@");
                $scope.verifyCorrectDataPosition();
                console.log("dentro WATCH positionDetected newValue = 2, $scope.step1PositionOk = ", $scope.step1PositionOk);
                $scope.sagomaBorderYellow = false;
                $scope.sagomaBorderGreen = true;
            }, 1300);
        }
    };


    /* Modal that show the report detail */
    $scope.reportModal = function () {
        $mdDialog.show({
            templateUrl: "applications/" + $scope.object.objectId + "/modal/test_report_modal.tmpl.html",
            controller: ReportModalController,
            clickOutsideToClose: true,
            bindToController: true,
            //controllerAs: HomeController,
            scope: $scope,
            preserveScope: true,
            parent: angular.element(document.getElementById("targetBody")),
            //targetEvent: ev,
            fullscreen: true
        }).then(function (answer) {
            //console.log(" ---------- dentro al than ---------");
        }, function () {
            //console.log(" ---------- dentro al function ---------");
        });
    };

    function ReportModalController($scope, $mdDialog) {

        $scope.hide = function () {
            $mdDialog.hide();
        };

        $scope.cancel = function () {
            $mdDialog.cancel();
        };

        $scope.answer = function (answer) {
            $mdDialog.hide(answer);
        };
    }

    /* Function that Send the Report by mail */
    $scope.mailSent = 0;
    $scope.sendReportByMail = function () {
        console.log("$scope.personEmail = ", $scope.personEmail);

        $scope.mailSent = 1;

        var subjectSexAbbr = "";
        if ($scope.sesso === "uomo") {
            subjectSexAbbr = "del Sig.";
        } else if ($scope.sesso === "donna") {
            subjectSexAbbr = "della Sig.ra";
        }

        $http.post("/apio/service/mail/send", {
            // name: $scope.personName,
            // surname: $scope.personSurname,
            attachments: [{
                filename: "Scheda Comfort Test di " + $scope.personName + " " + $scope.personSurname + ".pdf",
                path: "./public/applications/12/PDF/scheda_cliente.pdf"
            }],
            mail: $scope.personEmail,
            subject: "ComfortTest LordFlex's: scheda " + subjectSexAbbr + " " + $scope.personSurname,
            text: "Salve, di seguito alleghiamo il report del ComfortTest che lei ha effettuato. Per qualsiasi ulteriore informazioni non esiti a contattarci. Cordialmente."
        }).then(function (response) {
            console.log("Mail inviata, response: ", response);
            $scope.mailSent = 2;
            console.log("$scope.mailSent = ", $scope.mailSent);
            setTimeout(function () {
                $scope.mailSent = 0;
                $scope.personEmail = "";
                $scope.$applyAsync();
                console.log("$scope.mailSent = ", $scope.mailSent);
                //$mdDialog.hide();
            }, 900);

        }, function (error) {
            console.log("Mail NON inviata, error: ", error);
            $scope.mailSent = 3;
            console.log("$scope.mailSent = ", $scope.mailSent);
            setTimeout(function () {
                $scope.mailSent = 0;
                $scope.$applyAsync();
                console.log("$scope.mailSent = ", $scope.mailSent);
                //$mdDialog.hide();
            }, 900);
        });


    };

    /* CATALOGUE functions and variables ----------------------------- */
    $scope.catalogue = [
        {
            model: "Aniversario50",
            name: "Aniversario 50",
            positionMotor: "0",
            urlIcon: "/applications/" + $scope.object.objectId + "/mattresses_img/aniversario50.png",
            urlDesktop: "/applications/" + $scope.object.objectId + "/mattresses_img/schede/Aniversario50.png",
            urlMobile: "/applications/" + $scope.object.objectId + "/mattresses_img/schedeMobile/Aniversario50.png"
        },
        {
            model: "Bliss",
            name: "Bliss",
            positionMotor: "1",
            urlIcon: "/applications/" + $scope.object.objectId + "/mattresses_img/bliss.png",
            urlDesktop: "/applications/" + $scope.object.objectId + "/mattresses_img/schede/Bliss.png",
            urlMobile: "/applications/" + $scope.object.objectId + "/mattresses_img/schedeMobile/Bliss.png"
        },
        {
            model: "Lady Memory",
            name: "Lady Memory",
            positionMotor: "2",
            urlIcon: "/applications/" + $scope.object.objectId + "/mattresses_img/ladymemory.png",
            urlDesktop: "/applications/" + $scope.object.objectId + "/mattresses_img/schede/LadyMemory.png",
            urlMobile: "/applications/" + $scope.object.objectId + "/mattresses_img/schedeMobile/LadyMemory.png"
        },
        {
            model: "Aquagel",
            name: "Aquagel",
            positionMotor: "3",
            urlIcon: "/applications/" + $scope.object.objectId + "/mattresses_img/aquagel.png",
            urlDesktop: "/applications/" + $scope.object.objectId + "/mattresses_img/schede/Aquagel.png",
            urlMobile: "/applications/" + $scope.object.objectId + "/mattresses_img/schedeMobile/Aquagel.png"
        },
        {
            model: "Lady Soft",
            name: "Lady Soft",
            positionMotor: "4",
            urlIcon: "/applications/" + $scope.object.objectId + "/mattresses_img/ladysoft.png",
            urlDesktop: "/applications/" + $scope.object.objectId + "/mattresses_img/schede/LadySoft.png",
            urlMobile: "/applications/" + $scope.object.objectId + "/mattresses_img/schedeMobile/LadySoft.png"
        },
        {
            model: "Melody/Bios crine zip",
            name: "Melody",
            name2: "Bios Crine Zip",
            positionMotor: "5",
            urlIcon: "/applications/" + $scope.object.objectId + "/mattresses_img/melody_bios_crine_zip.png",
            urlDesktop: "/applications/" + $scope.object.objectId + "/mattresses_img/schede/Melody.png",
            urlDesktop2: "/applications/" + $scope.object.objectId + "/mattresses_img/schede/Bios.png",
            urlMobile: "/applications/" + $scope.object.objectId + "/mattresses_img/schedeMobile/Melody.png",
            urlMobile2: "/applications/" + $scope.object.objectId + "/mattresses_img/schedeMobile/Bios.png"
        },
        {
            model: "Oblio MP",
            name: "Oblio MP",
            positionMotor: "6",
            urlIcon: "/applications/" + $scope.object.objectId + "/mattresses_img/oblio_mp.png",
            urlDesktop: "/applications/" + $scope.object.objectId + "/mattresses_img/schede/OblioMP.png",
            urlMobile: "/applications/" + $scope.object.objectId + "/mattresses_img/schedeMobile/OblioMP.png"
        },
        {
            model: "Dormiglione",
            name: "Dormiglione",
            positionMotor: "7",
            urlIcon: "/applications/" + $scope.object.objectId + "/mattresses_img/dormiglione.png",
            urlDesktop: "/applications/" + $scope.object.objectId + "/mattresses_img/schede/Dormiglione.png",
            urlMobile: "/applications/" + $scope.object.objectId + "/mattresses_img/schedeMobile/Dormiglione.png"
        },
        {
            model: "Pixel",
            name: "Pixel",
            positionMotor: "8",
            urlIcon: "/applications/" + $scope.object.objectId + "/mattresses_img/pixel.png",
            urlDesktop: "/applications/" + $scope.object.objectId + "/mattresses_img/schede/Pixel.png",
            urlMobile: "/applications/" + $scope.object.objectId + "/mattresses_img/schedeMobile/Pixel.png"
        },
        {
            model: "Lady Più",
            name: "Lady Più",
            name2: "Lady Più",
            positionMotor: "9",
            urlIcon: "/applications/" + $scope.object.objectId + "/mattresses_img/ladypiu.png",
            urlDesktop: "/applications/" + $scope.object.objectId + "/mattresses_img/schede/LadyPiu.png",
            urlDesktop2: "/applications/" + $scope.object.objectId + "/mattresses_img/schede/LadyPiu.png",
            urlMobile: "/applications/" + $scope.object.objectId + "/mattresses_img/schedeMobile/ladypiu.png",
            urlMobile2: "/applications/" + $scope.object.objectId + "/mattresses_img/schedeMobile/LadyPiu.png"
        },
        {
            model: "Memory",
            name: "Memory",
            positionMotor: "10",
            urlIcon: "/applications/" + $scope.object.objectId + "/mattresses_img/memory.png",
            urlDesktop: "/applications/" + $scope.object.objectId + "/mattresses_img/schede/Memory.png",
            urlMobile: "/applications/" + $scope.object.objectId + "/mattresses_img/schedeMobile/Memory.png"
        },
        {
            model: "Vanity",
            name: "Vanity",
            positionMotor: "11",
            urlIcon: "/applications/" + $scope.object.objectId + "/mattresses_img/vanity.png",
            urlDesktop: "/applications/" + $scope.object.objectId + "/mattresses_img/schede/Vanity.png",
            urlMobile: "/applications/" + $scope.object.objectId + "/mattresses_img/schedeMobile/Vanity.png"
        },
        {
            model: "Brio",
            name: "Brio",
            positionMotor: "12",
            urlIcon: "/applications/" + $scope.object.objectId + "/mattresses_img/brio.png",
            urlDesktop: "/applications/" + $scope.object.objectId + "/mattresses_img/schede/Brio.png",
            urlMobile: "/applications/" + $scope.object.objectId + "/mattresses_img/schedeMobile/Brio.png"
        },
        {
            model: "Fitness/Mariana's",
            name: "Fitness",
            name2: "Mariana's",
            positionMotor: "13",
            urlIcon: "/applications/" + $scope.object.objectId + "/mattresses_img/fitness_marianas.png",
            urlDesktop: "/applications/" + $scope.object.objectId + "/mattresses_img/schede/Fitness.png",
            urlDesktop2: "/applications/" + $scope.object.objectId + "/mattresses_img/schede/Marianas.png",
            urlMobile: "/applications/" + $scope.object.objectId + "/mattresses_img/schedeMobile/Fitness.png",
            urlMobile2: "/applications/" + $scope.object.objectId + "/mattresses_img/schedeMobile/Marianas.png"
        }
    ];

    /* Modal that show mattress detail */
    $scope.mattressInfo = function (value) {
        console.log("matress", value);
        //$scope.simulateRealMaterass(value.positionMotor);
        //alert('');

        $mdDialog.show({
            locals: {
                value: value
            },
            templateUrl: "applications/" + $scope.object.objectId + "/modal/mattresses_info.tmpl.html",
            controller: MattressInfoController,
            clickOutsideToClose: true,
            bindToController: true,
            //controllerAs: HomeController,
            scope: $scope,
            preserveScope: true,
            parent: angular.element(document.getElementById("targetBody")),
            //targetEvent: ev,
            fullscreen: true
        }).then(function (answer) {
            //console.log(" ---------- dentro al than ---------");
        }, function () {
            //console.log(" ---------- dentro al function ---------");
        });
    };

    function MattressInfoController($scope, $mdDialog, value) {
        $scope.value = value;
        //console.log("[Mattress details] value = ", $scope.value);

        $scope.twoMattressInfo = !!($scope.value.name2 && $scope.value.name2 !== "");
        $scope.mattressInfo1 = true;
        $scope.mattressInfo2 = false;
        $scope.showMattressInfo = function (num) {
            if (num === "2") {
                $scope.mattressInfo1 = false;
                $scope.mattressInfo2 = true;
            } else if (num === "1") {
                $scope.mattressInfo1 = true;
                $scope.mattressInfo2 = false;
            }
        };

        $scope.hide = function () {
            $mdDialog.hide();
        };

        $scope.cancel = function () {
            $mdDialog.cancel();
        };

        $scope.answer = function (answer) {
            $mdDialog.hide(answer);
        };
    }


}]);

setTimeout(function () {
    angular.bootstrap(document.getElementById("ApioApplication12"), ["ApioApplication12"]);
}, 10);