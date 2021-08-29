let c = document.getElementById("ahc-canvas");
const WIDTH = c.width;
const HEIGHT = c.height;
const new_sym = -1;
var global_tree;
//simple queue implementation
class QueueNode{
    constructor(val){
        this.next = null;
        this.val = val;
    }
}
class Queue{
    constructor(){
        // linked list points from front to back
        this.front = null; // data leaves from front of queue. Also head
        this.back = null; // data enters back of queue. Also tail
        this.size = 0;
    }
    get length(){
        return this.size;
    }
    enqueue(val){ //add new node to back
        var node = new QueueNode(val);
        if(this.front === null){ //if queue is empty, front = back = new node
            this.front = node;
            this.back = node;
        }
        else{
            this.back.next = node;
            this.back = this.back.next;
        }
        this.size++;
    }
    dequeue(){
        if(!this.front){
            return null;
        }
        var val = this.front.val;
        this.front = this.front.next;
        if(this.front === null){
            this.back = null;
        }
        this.size--;
        return val;
    }
    print(){ //log values in queue
        var node = this.front;
        var output = "";
        while(node){
            output += node.val + ", ";
            node = node.next;
        }
        if(output.length > 1)
            output = output.substring(0, output.length-2);
        console.log(output);
    }
    isEmpty(){
        return (this.front == null);
    }
}
class Node{
    constructor(parent, symbol){
        this.left = null;
        this.right = null;
        this.parent = parent;
        this.symbol = symbol;
        this.weight = 0;
    }
}
class Tree{
    constructor(){
        this.root = new Node(null, "NEW");
        this.size = 1; //number of nodes in the tree
        this.weight_sum = 0; //sum of all weights
        this.nodes = {"NEW": this.root}; //dictionary to track and find symbols which exist in tree
        this.fixed = {};
        this.orderedNodes = [];
        this.swapCount = 0;
    }
    init(nSym){
        const bits = Math.ceil(Math.log2(nSym));
        for (var i=0; i<nSym; i++){
            var binString = i.toString(2);
            this.fixed[String.fromCharCode(i)] = "0".repeat(bits-binString.length) + binString;
        }
    }
    swap(n1, n2){//n1, n2 CANNOT be root
        if(n1 === this.root || n2 === this.root){
            console.log("Error: tried to swap root");
            return;
        }
        console.log("swapping: ", n1.symbol, n1.weight, "with: ", n2.symbol, n2.weight);
        console.log("n1 parent: ", n1.parent, "n2 parent: ", n2.parent);
        /*
        if(n1.parent === n2){
            //n2 is n1's parent
            console.log("help");
            this.parentSwap(n2, n1);
            return;
        }
        else if(n2.parent === n1){
            //n1 is n2's parent
            console.log("me");
            this.parentSwap(n1, n2);
            return;
        }
        */
        //Swapping one at a time can cause an error with this logic.
        //Instead check both first, then swap both.
        var temp = n1;
        var dir1, dir2;
        var p1 = n1.parent;
        var p2 = n2.parent;
        if(n1.parent.right === n1){
            n1.parent.right = n2;
            dir1 = 'r';
        }
        else if(n1.parent.left === n1){
            n1.parent.left = n2;
            dir1 = 'l';
        }
        else{
            console.log("swap error");
        }
        if(n2.parent.right === n2){
            n2.parent.right = temp;
            dir2 = 'r';
        }
        else if(n2.parent.left === n2){
            n2.parent.left = temp;
            dir2 = 'l';
        }
        else{
            console.log("swap error");
        }
        n2.parent = p1;
        n1.parent = p2;
        console.log("swapped");
        console.log("n1 parent: ", n1.parent, "n2 parent: ", n2.parent);
        /*
        console.log(dir1, dir2);
        n2.parent = p1;
        n1.parent = p2;
        if(dir1 === 'r'){
            n1.parent.right = n1;
        }
        else{
            n1.parent.left = n1;
        }
        if(dir2 === 'r'){
            n2.parent.right = n2;
        }
        else{
            n2.parent.left = n2;
        }
        */
    }
    parentSwap(parent, child){
        /* var node= parent;
        // Try to find a node to the left of the parent.
        // If we can't, then move up n nodes to get to the root
        // and go down n+1 nodes right of the root.
        var levelAdded = 1;
        var leftNode;
        node = node.parent;
        while(node !== this.root){
            leftNode = node;
            for(var i=0; i<levelAdded; i++){
                if(!leftNode.left){
                    break;
                }
                else{
                    leftNode = 
                }
            }
        } */
        //The above method is messy, inefficient and prone to bugs.
        // Instead: track the node order and add one to the index.
        var parentIdx = this.orderedNodes.indexOf(parent);
        this.swap(this.orderedNodes[parentIdx + 1], child);

    }
    getPath(node){
        var path = "";
        var bit;
        var prev;
        while(node != this.root){
            prev = node;
            node = node.parent;
            bit = (node.left === prev) ? "0" : "1";
            path = bit + path;
        }
        return path;
    }
    encodeSymbol(c){
        if(this.nodes[c] === undefined){
            return this.getPath(this.nodes["NEW"]) + this.fixed[c];
        }
        else{
            return this.getPath(this.nodes[c]);
        }
    }
    recountWeights(node){
        //Once any tree node gets swapped, need to update the weights.
        var l = 0;
        var r = 0;
        if(node.left){
            l = this.recountWeights(node.left);
        }
        if(node.right){
            r = this.recountWeights(node.right);
        }
        if(l+r !== 0){//ie not a leaf node
            node.weight = l + r;
            return l+r;
        }
        else{
            return node.weight;
        }
    }
    update(c){
        var node = this.nodes[c];
        if(node === undefined){ //if new char, add new node
            node = this.nodes["NEW"];
            node.left = new Node(node, "NEW");
            node.right = new Node(node, c);
            node.right.weight = 1; //set child weight to 1 since this is first appearance of c
            this.weight_sum++;
            this.size++;
            node.symbol = null;
            this.nodes["NEW"] = node.left;
            this.nodes[c] = node.right;
        }
        // Add 1 to each node's weight at and above current node
        node.weight++;
        this.weight_sum++;
        while(node != this.root){
            node = node.parent;
            node.weight++;
            this.weight_sum++;
        }
        this.swapCount = 0;
        var done = false;
        while(!done){
            done = true; //If no out of order nodes are found, loop will end.
            //var orderedNodes = [];
            var q = new Queue();
            
            this.orderedNodes = [];
            
            // top to bottom, right to left level order traversal:
            // put right, left node in queue, dequeue next node
            q.enqueue(this.root)
            while(!q.isEmpty()){
                node = q.dequeue();
                // push nodes to an array to check later
                this.orderedNodes.push(node);
                
                if(node.right){
                    q.enqueue(node.right);
                }
                if(node.left){
                    q.enqueue(node.left);
                }
                //prevNode = node;
            }
            // orderedNodes are in reverse level order, so weights should be monotonically non-increasing
            // Loop through level order tree and swap furthest two nodes (and set done to false) if necessary
            var high = this.root; // This is the highest order node with equal weight to the current node
            var low = undefined; // This is the lowest order node with weight higher than the "high" node
            // low and high will be swapped if low is found
            console.log("ordered nodes:");
            for(const n of this.orderedNodes){
                if(!low){ //if we've found a low, check for equal valued nodes to get furthest one.
                    if(n.weight < high.weight){
                        high = n;
                    }
                    else if(n.weight > high.weight){
                        low = n;
                        done = false;
                    }
                }
                else{
                    if(low.weight === n.weight){
                        low = n;
                    }
                    else{
                        this.swap(low, high);
                        this.recountWeights(this.root);
                        this.swapCount++;
                        if(this.swapCount>1000){
                            done = true;
                            // In the case that there is an uncaught bug and enters infinite loop, 
                            // this will stop trying to swap and inform user.
                            alert("Error: Swapping failed.");
                        }
                        break; //no need to check further, as entire tree should be re-evaluated after swapping
                    }
                }
            }
        }
        

    }
    print(){
        var output = "";
        var q = new Queue();
        q.enqueue(this.root);
        while(!q.isEmpty()){
            var node = q.dequeue();
            output += node.symbol + ": " + node.weight + ", ";
            if(node.right){
                q.enqueue(node.right);
            }
            if(node.left){
                q.enqueue(node.left);
            }
        }
        console.log(output);
        for (const [key, value] of Object.entries(this.nodes)) {
            console.log(`${key}: ${value.weight}`);
        }
        
    }
    printLevel(){
        console.log("Nodes in level order");
        for(const n of this.orderedNodes){
            console.log(n.symbol, n.weight);
        }
    }
    draw(node, x, y, scale){
        const radius = 22;
        const yOffset = 100;
        var ctx = c.getContext("2d");
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#8fcccc';
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.font = '12px serif';
        ctx.fillStyle = 'black';
        ctx.fillText(`${node.symbol}: ${node.weight}`, x, y+5);
        if(node.left){
            ctx.moveTo(x, y+radius);
            ctx.lineTo(x-scale/2, y+yOffset-radius);
            ctx.stroke();
            ctx.fillText("0", (2*x-scale/2)/2, (2*y+yOffset)/2 + yOffset/6);
            this.draw(node.left, x-scale/2, y+yOffset, scale/2);
        }
        if(node.right){
            ctx.moveTo(x, y+radius);
            ctx.lineTo(x+scale/2, y+yOffset-radius);
            ctx.stroke();
            ctx.fillText("1", (2*x+scale/2)/2, (2*y+yOffset)/2 + yOffset/6);
            this.draw(node.right, x+scale/2, y+yOffset, scale/2);
        }
    }
    clear(){
        var ctx = c.getContext("2d");
        ctx.clearRect(0,0,WIDTH,HEIGHT);
    }
}

$("#ahc-input").on("change keyup paste", function(){
    encodeStr(document.getElementById("ahc-input"));
})

function encodeStr(e){
    const str = e.value;
    nSym = 256;
    var tree = new Tree();
    global_tree = tree;
    tree.init();

    for(ch of str){
        var code = tree.encodeSymbol(ch);
        tree.update(ch);
    }
    tree.clear();
    tree.draw(tree.root, WIDTH/2, 50, WIDTH/2);
    
}


function encodingTest(){
    //const str = "AABCDAD";
    const str = "aardvark";
    const nSym = 128;
    var tree = new Tree();
    tree.init(nSym);
    
    for(var ch of str){
        var code = tree.encodeSymbol(ch);
        console.log(code);
        tree.update(ch);
    }
    //tree.print();
    tree.clear();
    tree.draw(tree.root, WIDTH/2, 50, WIDTH/2);
}