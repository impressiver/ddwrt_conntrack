'use strict';

// Bandwidth Graph Colours
var color = ['#ffaaaa','#ffddaa','#aaffaa','#aaffff','#aaddff','#aaaaff','#ffaadd','#aaaaaa','#dd8888','#ddbb88','#88dd88','#88dddd','#88bbdd','#8888dd','#dd88bb','#888888'];
// Variables
var connections = [];
var clients = [];
var hosts = {};
var ports = [];
var refresh = true;
var conntrack = '';
var lasttime = +new Date();
var timelag = 1;
// How long we wait to get an average speed
var offset = 5;
var iteration = offset - 1;
// Quality of Service names and row colours
var qos = [];
var qos_col = [];
qos[0]      = ' Default';
qos_col[0]  = '#ffffaa';
qos[10]     = 'Premium';
qos_col[10] = '#99ffff';
qos[20]     = 'Express';
qos_col[20] = '#99ff99';
qos[30]     = 'Standard';
qos_col[30] = '#ffffaa';
qos[40]     = 'Bulk';
qos_col[40] = '#ffaaaa';
// Standard ports, these should be accurate
var service = [];
service[20] = 'FTP-Data';
service[21] = 'FTP';
service[22] = 'SSH';
service[23] = 'Telnet';
service[25] = 'SMTP';
service[53] = 'DNS';
service[67] = 'DHCP/BOOTPS';
service[68] = 'DHCP/BOOTPD';
service[80] = 'HTTP';
service[88] = 'X-Box Live UDP';
service[110] = 'POP3';
service[113] = 'IDENTD';
service[123] = 'NTP';
service[119] = 'NNTP';
service[137] = 'NetBIOS NS';
service[138] = 'NetBIOS DGM';
service[139] = 'NetBIOS';
service[143] = 'IMAP';
service[443] = 'HTTPS';
service[514] = 'Syslog';
service[631]  = 'CUPS';
// None standard ports, other protocols may also use the same ports as something listed here
service[1701] = 'L2TP';
service[1812] = 'RADIUS';
service[1813] = 'RADIUS Accounting';
service[1863] = 'Live Messenger';
service[1900] = 'SSDP UPnP';
service[3074] = 'X-Box Live';
service[3478] = 'STUN NAT';
service[3479] = '2Wire RPC';
service[3544] = 'Teredo IPv6';
service[3658] = 'Playstation AMS';
service[5050] = 'Yahoo Messenger';
service[5060] = 'SIP VoIP';
service[5190] = 'AOL/ICQ Messenger';
service[9293] = 'Playstation Net';
var update;

// Mark hosts online/offline according to the arp table
function setArp(str) {
  for (var host in hosts) { hosts[host].online = false; }
  var args = str.split(',').map(function(arg) { return arg.replace(/^'(.*)'$/, '$1'); });
  for(var i = 0; i < args.length; i = i + 2) { 
    if (!hosts[args[i]]) hosts[args[i]] = {};
    hosts[args[i]].online = true;
    hosts[args[i]].mac = args[i+1];
  }
}
// The first table, bandwidth and client list
function setBWTable(str) {
  var barup, bardown,
      clientid, upMisc, downMisc, upstream, uploaded, downstream, downloaded,
      clientbw_up, clientbw_down,
      thistime = +new Date(),
      toggler = true,
      table = $('traffic_table'),
      args = str.split(',').map(function(arg) { return arg.replace(/^'(.*)'$/, '$1'); });

  barup = bardown = '';
  clientid = upMisc = downMisc = upstream = uploaded = downstream = downloaded = 0;
  clientbw_up = clientbw_down = [];
  iteration++; 
  clients.length = 0;
  timelag = (thistime - lasttime)/1000;

  cleanTable(table);
  
  for(var i = 0; i < args.length; i = i + 3) {
    var row = table.insertRow(-1),
        cellcount;

    row.style.height = '15px';    
    toggler = toggle(toggler);

    if (args[i] == '-') {
      row.style.background = toggler ? '#dddddd' : '#eeeeee';
      
      cellcount = row.insertCell(-1);
      cellcount.colSpan = '4';      
      cellcount.innerHTML = 'Connections ' + connections.length + ' / ' + ip_conntrack_max + ' max (' + Math.round((connections.length/ip_conntrack_max)*100) + '%)';
      cellcount.style.textAlign = 'center';    
      
      cellcount = row.insertCell(-1);    
      cellcount.innerHTML = killthebyte(upstream) + ' ('+kbit_usage(upstream, qos_uplink)+'%)';
      cellcount.style.textAlign = 'right';   
      
      cellcount = row.insertCell(-1);    
      cellcount.innerHTML = killthebyte(downstream) + ' ('+kbit_usage(downstream, qos_downlink)+'%)';
      cellcount.style.textAlign = 'right';       
      
      cellcount = row.insertCell(-1);    
      cellcount.innerHTML = killthebyte(uploaded);
      cellcount.style.textAlign = 'right';        
      
      cellcount = row.insertCell(-1);
      cellcount.innerHTML = killthebyte(downloaded);
      cellcount.style.textAlign = 'right';    
      
      i = args.length;
      if (upMisc >= 1) barup += '<div style=\'text-align: center; width: '+upMisc+'%; height: 100%; background: red; color: black;  float: left;\'>*</div>';
      if (downMisc >= 1) bardown += '<div style=\'text-align: center; width: '+upMisc+'%; height: 100%; background: red; color: black;  float: left;\'>*</div>';
    } else {
      clientid = clients.length;
      var name = lookup(args[i],'*');
      clients[clientid] = args[i];       
      // Count Connections per IP
      var connect = 0; for (var con=0; con<connections.length; con++) if (connections[con][0] == args[i]) connect++;
      // Upload
      var up = args[i+1]*1;
      var upLoad = bandwidth(args[i],'upstream',up);
      var upPct = kbit_usage(upLoad,qos_uplink);
      upstream = upstream + upLoad;
      uploaded = uploaded + args[i+1]*1;
       // Download
      var down = args[i+2]*1;
      var downLoad = bandwidth(args[i],'downstream',down);          
      var downPct = kbit_usage(downLoad,qos_downlink);
      downstream = downstream + downLoad;           
      downloaded = downloaded + args[i+2]*1;    
      // Online/Offline
      var online = hosts[args[i]].online;
      row.style.color = online ? '#00aa00' : '#aa0000';
      row.style.background = toggler ? online ? '#ddffdd' : '#ffdddd' : online ? '#eeffee' : '#ffeeee';
      
      // Generate the table
      cellcount = row.insertCell(-1);
      cellcount.style.textAlign = 'right';
      cellcount.innerHTML = (clientid+1)+'.';
      cellcount.style.background = color[clientid];
      row.insertCell(-1).innerHTML = name;
      
      cellcount = row.insertCell(-1);
      cellcount.innerHTML = args[i];
      
      cellcount = row.insertCell(-1);
      cellcount.innerHTML = connect;
      cellcount.style.textAlign = 'center';    
      
      // Upload Speed
      cellcount = row.insertCell(-1);
      cellcount.innerHTML = killthebyte(upLoad) + ' ('+upPct+'%)';    
      cellcount.style.textAlign = 'right';
      
      // Download Speed
      cellcount = row.insertCell(-1);    
      cellcount.innerHTML = killthebyte(downLoad) + ' ('+downPct+'%)'; 
      cellcount.style.textAlign = 'right';      
      
      // Upload Total
      cellcount = row.insertCell(-1);          
      cellcount.innerHTML = killthebyte(up);
      cellcount.style.textAlign = 'right';
      
      // Download Total
      cellcount = row.insertCell(-1);
      cellcount.innerHTML = killthebyte(down);
      cellcount.style.textAlign = 'right';
      
      // Generate information for the pie charts
      var clientLength = clientid.toString().length+1;
      if (upPct > 0) {
        if (upPct < clientLength) name = ''; else if (upPct < name.length+1) name = clientid+1;
        barup += '<div style=\'text-align: center; width: '+upPct+'%; height: 100%; background: '+keycolor(clientid)+'; color: black;  float: left;\'>'+name+'</div>';
      } else upMisc = upMisc + kbit_usage(upLoad, qos_uplink, 1);
      if (downPct > 0) {
        if (downPct < clientLength) name = ''; else if (downPct < name.length+1) name = clientid+1;
        bardown += '<div style=\'text-align: center; width: '+downPct+'%; height: 100%; background: '+keycolor(clientid)+'; color: black; float: left;\'>'+name+'</div>';
      }    
      else downMisc = downMisc + kbit_usage(downLoad, qos_downlink, 1);
      }      
    // Generate the pie chart data object
    //clientbw_up[clientid] = { data: [upPct,upPct,upPct,upPct], label: name }   
    //clientbw_down[clientid] = { data: [downPct], label: name }      
  }
  if (iteration == offset) { 
    lasttime = thistime; iteration = 0;
    $('BarUp').innerHTML = barup;
    $('BarDown').innerHTML = bardown;
    //new Proto.Chart($('PieUp'),clientbw_up, { pies: {show: true, autoScale: true}, legend: {show: true} });
    //new Proto.Chart($('PieDown'),clientbw_down, { pies: {show: true, autoScale: true}, legend: {show: true} });    
  }    
  setPORTTable();
}

// The second table, ports in use per client and number of connections
function setPORTTable() {
  var toggler = true,
      table = $('ports_table');

  cleanTable(table);

  for(var i=0;i<clients.length;i++) {
    var unknown = 0,
        lastclient, clientname, row, cellcount;

    for(var p=0; p<ports.length; p++) {
      var cons = 0;
      
      for (var c in ports[p]) {
        if (ports[p][c] == clients[i]) cons++;
      }

      if (cons > 0 && !service[p]) unknown = unknown + cons;
      else if (cons > 0) {
        clientname = (lastclient == clients[i]) ? '&nbsp;' : lookup(clients[i]);
        lastclient = clients[i];
        
        row = table.insertRow(-1);
        row.style.height = '15px';
        row.style.border = '0px';
        row.style.background = toggler ? '#dddddd' : '#eeeeee';
        row.insertCell(-1).innerHTML = clientname;
        row.insertCell(-1).innerHTML = service[p];
        
        cellcount = row.insertCell(-1);
        cellcount.style.textAlign = 'center';
        cellcount.innerHTML = cons;
      }
    }

    if (unknown > 0) {
      clientname = (lastclient == clients[i]) ? '&nbsp;' : lookup(clients[i]);
      lastclient = clients[i];      
      
      row = table.insertRow(-1);
      row.style.height = '15px';
      row.style.border = '0px';
      row.style.background = toggler ? '#dddddd' : '#eeeeee';
      row.insertCell(-1).innerHTML = clientname;
      row.insertCell(-1).innerHTML = 'Other';
      
      cellcount = row.insertCell(-1);
      cellcount.style.textAlign = 'center';
      cellcount.innerHTML = unknown;      
      unknown = 0;
    }
    toggler = toggle(toggler);
  }
}
// The main data, the other tables are derived from this data
function setCONTable(str) {  
  ports.length = 0;
  connections.length = 0;
  var args = str.split(',').map(function(arg) { return arg.replace(/^'(.*)'$/, '$1'); }),
      table = $('active_connections_table');

  if (refresh) {  
    cleanTable(table);
  }

  for(var i = 0; i < args.length; i = i + 6) {
    if (args[i] != '-') {
      var con = (args[i] == 'unknown') ? '-' : args[i].toUpperCase();
      // Generate the ports array
      var portslen = ports[args[i+4]] ? ports[args[i+4]].length : 0;

      if (typeof(ports[args[i+4]]) == 'undefined') ports[args[i+4]] = [];
      ports[args[i+4]][portslen] = args[i+1];

      // Create a connections array
      if (i === 0)  { connections[0] = []; }
      connections.push([[args[i+1]],[args[i+2]],[args[i+4]]]);
      if (refresh) {
        if (conntrack === '' || conntrack === args[i+1]) {
        // Insert row into our real table
        var row = table.insertRow(-1);
        row.style.background = qos_col[args[i+5]];
        row.style.height = '15px';
        
        var cellcount = row.insertCell(-1);
        cellcount.style.textAlign = 'center';
        cellcount.innerHTML = con; 
        
        cellcount = row.insertCell(-1);    
        cellcount.innerHTML = lookup(args[i+1]);
        
        cellcount = row.insertCell(-1);
        cellcount.innerHTML = servicePort(args[i+2]);
        
        cellcount = row.insertCell(-1);
        cellcount.innerHTML = lookup(args[i+3]);  
        
        cellcount = row.insertCell(-1);
        cellcount.innerHTML = servicePort(args[i+4]);
        
        cellcount = row.insertCell(-1);
        cellcount.innerHTML = qos_rating(args[i+5]);
        }
      }
    }
  }
}

function bandwidth(ip,direction,cur) {
  var bw;
  if(!hosts[ip]) hosts[ip] = { direction: 0 };
  if (hosts[ip][direction] === false) {
    bw = '-';
    hosts[ip][direction] = cur;
    hosts[ip][direction+'_last'] = 0;    
  }
  else if (iteration == offset) {
    bw = (cur-hosts[ip][direction])/timelag;
    hosts[ip][direction] = cur;
    hosts[ip][direction+'_last'] = bw;
  }
  else {
    bw = hosts[ip][direction+'_last'];
  }
  return bw;
}

function keycolor(id) {
  if (id >= color.length) id = id - color.length;
  return color[id];
}

function toggle(a) {return a ? false : true;}

function setConntrack(ip) {
  conntrack = ip;
}  

function confresh() {
  refresh = toggle(refresh);
  $('conRefresh').innerHTML = refresh ? 'PAUSE' : 'RESUME';
}

function online(host) {
  return hosts[host] ? hosts[host].online ? true: false: false;
}

function lookup(ip,def) {
  var host;
  if (!def) def = ip;
  host = hosts[ip] ? hosts[ip].name ? hosts[ip].name : def : def;
  return host;
}

function servicePort(port) {
  return service[port] ? service[port] : port;
}

function kbit_usage(used,max,exact) {
  var percent;
  if (used > 0) {    
    used = (used*8)/1000;
    percent = exact ? (used/max)*100 : Math.round((used/max)*100);
    if (percent > 100) percent = 100;
  } else percent = 0;
  return percent;
}

function killthebyte(num) {
  if (num > 1125899906842624) return roundNumber((num/1125899906842624),1) + 'PiB';
  else if (num > 1099511627776) return roundNumber((num/1099511627776),1) + ' TiB';  
  else if (num > 1073741824) return roundNumber((num/1073741824),1) + ' GiB';  
  else if (num > 1048576) return roundNumber((num/1048576),1) + ' MiB';
  else if (num > 1024) return roundNumber((num/1024),1) + ' KiB';
  else if (num > 0) return roundNumber(num,1) + ' B';
  else return '-';
}

function roundNumber(num, dec) {
  var result = Math.round(num*Math.pow(10,dec))/Math.pow(10,dec);
  return result;
}

function qos_rating(rating) {
  var id, stars;
  rating = (+rating);
  if (rating === 40) { id = 1; stars = '*'; }
  else if (rating === 0 || rating === 30) { id = 2; stars = '**'; }
  else if (rating === 20) { id = 2; stars = '***'; }
  else if (rating === 10) { id = 2; stars = '****'; }
  else { id = 5; stars = 'n/a'; }
  stars = rating;
  return '<span style="visibility: hidden;">'+id+'</span>'+stars;
}

addEvent(window, 'load', function() {
  update = new StatusUpdate('user/traffic.asp', 1);
  update.onUpdate('arp', function(u) {
    setArp(u.arp);  
    });
  update.onUpdate('ip_conntrack', function(u) {
    setCONTable(u.ip_conntrack);  
    });
  update.onUpdate('bw_table', function(u) {
    setBWTable(u.bw_table);  
    });
  update.start();
});
addEvent(window, 'unload', function() {
  update.stop();
});
