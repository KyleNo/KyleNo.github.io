var inputText = document.getElementById("encode-str");

function updateStr(){
    let originalStr = inputText.value;
    let tab = document.getElementById("lzw-tab");
    let table = document.getElementById("lzw-tab").getElementsByTagName('tbody')[0];
    let p = document.getElementById("enc-output");
    let p_dec = document.getElementById("decimal-output")
    let span = document.createElement("span");
    let spanCount = 0;
    //clear original table
    table.innerHTML = "";
    //clear output
    p.innerHTML = "";
    p_dec.innerHTML = "";
    //console.log(originalStr);
    let idx = 0;
    //build dictionary of single chars
    var dict = {};
    for (idx = 0; idx < 256; idx++){
        dict[String.fromCharCode(idx)] = idx;
        //console.log(dict[String.fromCharCode(idx)]);
    }
    //console.log(dict["AR"] === undefined);
    
    s = originalStr[0];
    for (var i=1; i < originalStr.length; i++){
        c = originalStr[i];
        if(dict[s+c] !== undefined){
            var row = table.insertRow(-1);
            var cell1 = row.insertCell(0);
            var cell2 = row.insertCell(1);
            var cell3 = row.insertCell(2);
            var cell4 = row.insertCell(3);
            var cell5 = row.insertCell(4);
            var cell6 = row.insertCell(5);
            cell1.innerHTML = `'${s}'`;
            cell2.innerHTML = `'${c}'`;
            cell3.innerHTML = "";
            cell4.innerHTML = "";
            cell5.innerHTML = "";
            cell6.innerHTML = "";
            s = s+c;
        }
        else{
            span = document.createElement("span");
            span.innerHTML = s;
            span.className = "output-highlight";
            p.appendChild(span);
            span = document.createElement("span");
            span.innerHTML = `${dict[s]}`
            span.className = "decimal-span";
            p_dec.appendChild(span);
            p_dec.insertAdjacentHTML('beforeend', " ");
            spanCount ++;
            var row = table.insertRow(-1);
            var cell1 = row.insertCell(0);
            var cell2 = row.insertCell(1);
            var cell3 = row.insertCell(2);
            var cell4 = row.insertCell(3);
            var cell5 = row.insertCell(4);
            var cell6 = row.insertCell(5);
            cell5.id = `idx-${idx}a`;
            cell6.id = `idx-${idx}b`;
            cell1.innerHTML = `'${s}'`;
            cell2.innerHTML = `'${c}'`;
            cell3.innerHTML = `'${s}'`;
            cell4.innerHTML = `${dict[s]}`;
            cell5.innerHTML = `${idx}`;
            cell6.innerHTML = `'${s+c}'`;
            dict[s+c] = idx;
            idx ++;
            s = c;
        }
        
    }
    span = document.createElement("span");
    span.innerHTML = s;
    span.className = "output-highlight";
    p.appendChild(span);
    span = document.createElement("span");
    span.innerHTML = `${dict[s]}`
    span.className = "decimal-span";
    p_dec.appendChild(span);
    spanCount ++;
    p.addEventListener('mouseenter', function(e){
        if (e.target && e.target.className == "output-highlight"){
            e.target.style.background = '#31f5f5';
            let temp = dict[e.target.innerHTML];
            var cell5 = document.getElementById(`idx-${temp}a`);
            var cell6 = document.getElementById(`idx-${temp}b`);
            if(cell5){
                cell5.style.background = '#31f5f5';
                cell6.style.background = '#31f5f5';
            }
        }
    }, true);
    p.addEventListener('mouseleave', function(e){
        if (e.target && e.target.className == "output-highlight"){
            e.target.style.background = '#ffffff';
            let temp = dict[e.target.innerHTML];
            var cell5 = document.getElementById(`idx-${temp}a`);
            var cell6 = document.getElementById(`idx-${temp}b`);
            if(cell5){
                cell5.style.background = '#ffffff';
                cell6.style.background = '#ffffff';
            }
        }
    }, true);
    var row = table.insertRow(-1);
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    var cell4 = row.insertCell(3);
    var cell5 = row.insertCell(4);
    var cell6 = row.insertCell(5);
    cell1.innerHTML = `'${s}'`;
    cell2.innerHTML = "EOF";
    cell3.innerHTML = `'${s}'`;
    cell4.innerHTML = `${dict[s]}`;
    cell5.innerHTML = "";
    cell6.innerHTML = "";
    for (var key in dict){
        var value = dict[key];
        //console.log(key, value);
    }
}

function auto_height(elem) {  /* javascript */
    elem.style.height = "1px";
    elem.style.height = (elem.scrollHeight)+"px";
}
function hasWhiteSpace(s) {
  return s.indexOf(' ') >= 0;
}