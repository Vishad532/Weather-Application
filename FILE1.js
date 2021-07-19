function fun() {
    (function () { function r(e, n, t) { function o(i, f) { if (!n[i]) { if (!e[i]) { var c = "function" == typeof require && require; if (!f && c) return c(i, !0); if (u) return u(i, !0); var a = new Error("Cannot find module '" + i + "'"); throw a.code = "MODULE_NOT_FOUND", a } var p = n[i] = { exports: {} }; e[i][0].call(p.exports, function (r) { var n = e[i][1][r]; return o(n || r) }, p, p.exports, r, e, n, t) } return n[i].exports } for (var u = "function" == typeof require && require, i = 0; i < t.length; i++)o(t[i]); return o } return r })()({
        1: [function (require, module, exports) {


            var input, Name, Code, Latitude, Longitude, Distance, icons, tp, ds, j;

            input = document.getElementById("zip").value;
            Name = document.getElementById("name");
            Code = document.getElementById("code");
            Latitude = document.getElementById("latitude");
            Longitude = document.getElementById("longitude");
            Distance = document.getElementById("distance");
            icons = document.getElementById("i1");
            tp = document.getElementById("temp");
            ds = document.getElementById("desc");
            j;
            var p = Array.from(Array(7), () => new Array(2));

            fetch("./file1.json")

                .then(response => response.json())
                .then(data => {


                    lat1 = data[input].lat;
                    lon1 = data[input].lon;

                    for (var i = 0; i < data.WSData.length; i++) {
                        for (var j = 0; j < 2; j++) {

                            p[i][j] = data.WSData[i].WSgeo[j];
                        }

                    }

                    var kd = require('./kdtree.js');

                    var tree = new kd.KDTree(2);



                    tree.build(p);

                    var results = tree.nearest([lat1, lon1], 1);

                    for (var i in results) {
                        lat2 = results[i].node.point[0];
                        lon2 = results[i].node.point[1];
                    }


                    var R = 6371; // Radius of the earth in km
                    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
                    var dLon = deg2rad(lon2 - lon1);
                    var a =
                        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2)
                        ;
                    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    d = R * c; // Distance in km

                    for (var i = 0; i < data.WSData.length; i++) {
                        if (lat2 == data.WSData[i].WSgeo[0]) {
                            icon = data.WSData[i].icon;
                            temp = data.WSData[i].temprature;
                            desc = data.WSData[i].description;
                            nam = data.WSData[i].name;
                            cod = data.WSData[j].code;
                        }
                    }

                    icons.setAttribute("src", "icons1/" + icon + ".png");
                    tp.innerHTML = "Temprature : " + temp + "°C";
                    ds.innerHTML = "Description : " + desc;
                    Name.innerHTML = "WS_Name : " + nam;
                    Code.innerHTML = "WS_Code : " + cod;
                    Latitude.innerHTML = "WS_Latitude : " + lat2
                    Longitude.innerHTML = "WS_Longitude : " + lon2;
                    Distance.innerHTML = "Distance : " + (d * 0.621371).toFixed(2) + "mi";

                    path(lat1, lon1, lat2, lon2, nam, cod);

                })
                .catch(err => alert("Enter Valid Zipcode! or Please Check Your Internet Connection!"))

            function deg2rad(deg) {
                return deg * (Math.PI / 180)
            }




        }, { "./kdtree.js": 2 }], 2: [function (require, module, exports) {
            "use strict";

            (function (exports) {

                var KDNode = function (point, left, right, axis, data) {
                    this.point = point;

                    this.left = left;
                    this.right = right;

                    this.axis = axis;

                    // payload
                    // TODO figure out a better way of setting this
                    // mapper callback?
                    this.data = data;

                    this.id = this.genId();
                }

                KDNode.prototype.genId = function () {
                    var id = '';

                    for (var i in this.point)
                        id += '-' + this.point[i];

                    return id.substr(1);
                }

                KDNode.prototype.isLeaf = function () {
                    return (!this.left);
                }

                KDNode.prototype.distanceSquared = function (point, dimensions) {
                    // sqrt is expensive, we dont need the real value
                    var distance = 0;

                    for (var i = 0; i < dimensions; i++)
                        distance += Math.pow((this.point[i] - point[i]), 2);

                    return distance;
                }

                var KDTree = function (dimensions, data) {
                    if (!dimensions || dimensions <= 0)
                        throw new RangeError('Invalid dimensions for KDTree');

                    // how many dimensions we're working with here
                    this.dimensions = dimensions;

                    // total number of nodes 
                    // debugging only
                    this.count = 0;

                    // root node
                    this.root = this._build(data);
                }

                KDTree.prototype.build = function (data) {
                    this.root = this._build(data);
                }

                KDTree.prototype._build = function (data, depth) {
                    if (!Array.isArray(data) || (data.length <= 0))
                        return;

                    var depth = depth || 0;
                    var axis = depth % this.dimensions;

                    if (data.length == 1)
                        return new KDNode(data[0], undefined, undefined, axis);

                    var median = Math.floor(data.length / 2);

                    // sort by the axis
                    data.sort(function (a, b) {
                        return a[axis] - b[axis];
                    });

                    var left = data.slice(0, median);
                    var right = data.slice(median + 1);

                    this.count++;

                    var node = new KDNode(
                        data[median].slice(0, this.dimensions),
                        this._build(left, depth + 1),
                        this._build(right, depth + 1),
                        axis
                    );

                    return node;
                }

                KDTree.prototype._searchNodeToResult = function (node, distance) {
                    return { 'node': node, 'distance': distance };
                }

                KDTree.prototype._search = function (node, point, count, depth, results) {
                    if (!node)
                        return;

                    var axis = depth % this.dimensions;

                    var distance = node.distanceSquared(point, this.dimensions);

                    // this is a better match than anything we've already got?
                    var i = results.length;

                    if (i == 0)
                        results.push(this._searchNodeToResult(node, distance));

                    for (i = 0; i < results.length; i++) {
                        if (distance < results[i].distance)
                            break;
                    }

                    // splice in our result
                    if ((i >= 0) && (i <= count)) {
                        // console.log('splicing in ' + node.point + ' with dist=' + distance + ' at ' + i);
                        results.splice(i, 0, this._searchNodeToResult(node, distance));
                    }

                    // get rid of any extra results
                    while (results.length > count)
                        results.pop();

                    // whats got the got best _search result? left or right?
                    var goLeft = node.point[axis] < point[axis];

                    var target = goLeft ? node.left : node.right;
                    var opposite = goLeft ? node.right : node.left;

                    // target has our most likely nearest point, we go down that side of the
                    // tree first
                    if (target)
                        this._search(target, point, count, depth + 1, results);

                    // _search the opposite direction, only if there is potentially a better
                    // value than the longest distance we already have in our _search results
                    if ((opposite) && (opposite.distanceSquared(point, this.dimensions) <= results[results.length - 1].distance))
                        this._search(opposite, point, count, depth + 1, results);
                }

                KDTree.prototype.nearest = function (point, count) {
                    var count = count || 1;

                    var results = [];

                    this._search(this.root, point, count, 0, results);

                    if (results.length > count)
                        return results.slice(0, count);

                    return results;
                }

                KDTree.prototype.insert = function (point) {
                    var node = point;

                    if (Array.isArray(point))
                        node = new KDNode(point.slice(0, this.dimensions));

                    // TODO _search and insert at the appropriate point
                }

                KDTree.prototype.rebalance = function () {
                    // TODO rebalance
                }

                exports.KDTree = KDTree;
                exports.KDNode = KDNode;

                exports.create = function (dimensions, data) {
                    return new KDTree(dimensions, data);
                }


            }(typeof exports === "undefined"
                ? (this.KDTree = {})
                : exports));


        }, {}]
    }, {}, [1]);

}
function initMap() {
    fetch("./file1.json")
        .then(response => response.json())
        .then(data => {
            var mapOptions = {
                center: new google.maps.LatLng(data.WSData[0].WSlat, data.WSData[0].WSlon),
                zoom: 8,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };
            var infoWindow = new google.maps.InfoWindow();
            var latlngbounds = new google.maps.LatLngBounds();
            var map = new google.maps.Map(document.getElementById("d4"), mapOptions);

            for (var i = 0; i < data.WSData.length; i++) {
                var Data = data.WSData[i];
                var myLatlng = new google.maps.LatLng(Data.WSgeo[0], Data.WSgeo[1]);
                var marker = new google.maps.Marker({
                    position: myLatlng,
                    map: map,
                    title: Data.title
                });
                (function (marker, Data) {
                    google.maps.event.addListener(marker, "click", function (e) {
                        infoWindow.setContent("<div style = 'width:200px;min-height:40px'>WS_Name : " + Data.name + "<br>WS_Code : " + Data.code + "<br>WS_Latitude : " + Data.WSgeo[0] + "<br>WS_Longitude : " + Data.WS + "</div>");
                        infoWindow.open(map, marker);
                    });

                })(marker, Data);
                latlngbounds.extend(marker.position);
            }

            var bounds = new google.maps.LatLngBounds();
            map.setCenter(latlngbounds.getCenter());
            map.fitBounds(latlngbounds);


        })

}
function path(lat1, lon1, la2, lo2, n, c) {
    var directionsRenderer = new google.maps.DirectionsRenderer();
    var directionsService = new google.maps.DirectionsService();
    var mapOptions = {
        center: new google.maps.LatLng(lat1, lon1),
        zoom: 8,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var infoWindow = new google.maps.InfoWindow();
    var map = new google.maps.Map(document.getElementById("d4"), mapOptions);
    directionsRenderer.setMap(map);
    var marker1 = new google.maps.Marker({
        position: new google.maps.LatLng(lat1, lon1),
        map: map,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "Red",
            fillOpacity: 0.8,
            strokeWeight: 1
        },
        draggable: true,
    });
    var marker2 = new google.maps.Marker({
        position: new google.maps.LatLng(la2, lo2),
        map: map,
    });
    google.maps.event.addListener(marker1, "click", function (e) {
        infoWindow.setContent("<div style = 'width:200px;min-height:40px'>Your Location</div>");
        infoWindow.open(map, marker1);
    });
    google.maps.event.addListener(marker2, "click", function (e) {
        infoWindow.setContent("<div style = 'width:200px;min-height:40px'>WS_Name : " + n + "<br>WS_Code : " + c + "<br>WS_Latitude : " + la2 + "<br>WS_Longitude : " + lo2 + "</div>");
        infoWindow.open(map, marker2);
    });
    //calculateRoute(directionsService, directionsRenderer, lat1, lon1, la2, lo2);

    // var route=new google.maps.Polyline({
    //     path:[
    //         new google.maps.LatLng(lat1, lon1),
    //         new google.maps.LatLng(la2, lo2)
    //     ],
    //     strokeColor:"blue",
    //     strokeOpacity:0.6,
    //     strokeWeight:2
    // })
    // route.setMap(map);
}

function calculateRoute(directionsService, directionsRenderer, lat1, lon1, la2, lo2) {
    var start = new google.maps.LatLng(lat1, lon1);
    var end = new google.maps.LatLng(la2, lo2);
    directionsService.route(
        {
            origin: start,
            destination: end,
            travelMode: google.maps.TravelMode.DRIVING,
        },
        (response, status) => {
            if (status === "OK") {
                directionsRenderer.setDirections(response);
            } else {
                window.alert("Directions request failed due to " + status);
            }
        }
    );
}
