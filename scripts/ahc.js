let c = document.getElementById("ahc-canvas");
const WIDTH = c.width;
const HEIGHT = c.height;
const nyt = "NYT";
//var global_tree;
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
// Tree nodes
class Node{
    constructor(parent, symbol){
        this.left = null;
        this.right = null;
        this.parent = parent;
        this.symbol = symbol;
        this.weight = 0;
    }
}
// A binary tree which is used to encode symbols
class Tree{
    constructor(){
        this.root = new Node(null, nyt);
        this.size = 1; //number of nodes in the tree
        this.weight_sum = 0; //sum of all weights
        this.nodes = {}; //dictionary to track and find symbols which exist in tree
        this.nodes[nyt] = this.root;
        this.fixed = {}; //dictionary of fixed length codes
        this.orderedNodes = []; //a list of nodes in reverse level order
        this.swapCount = 0; //tracks times swapped in single update attempt. Prevented infinite loops while debugging, no longer used
    }
    init(nSym){
        const bits = Math.ceil(Math.log2(nSym)); // how many bits are needed to represent each symbol
        for (var i=0; i<nSym; i++){
            var binString = i.toString(2); //get binary string for each symbol
            this.fixed[String.fromCharCode(i)] = "0".repeat(bits-binString.length) + binString; //prefix shorter codes with zero
        }
    }
    //swap two non-root nodes on the tree
    swap(n1, n2){//n1, n2 CANNOT be root
        if(n1 === this.root || n2 === this.root){
            console.log("Error: tried to swap root"); //This should be unreachable
            return;
        }
        var temp = n1;
        var p1 = n1.parent;
        var p2 = n2.parent;
        //swap child pointers of parents
        if(n1.parent.right === n1){
            n1.parent.right = n2;
        }
        else if(n1.parent.left === n1){
            n1.parent.left = n2;
        }
        else{
            console.log("swap error"); //This should be unreachable
        }
        if(n2.parent.right === n2){
            n2.parent.right = temp;
        }
        else if(n2.parent.left === n2){
            n2.parent.left = temp;
        }
        else{
            console.log("swap error");
        }
        //swap parent pointers of children
        n2.parent = p1;
        n1.parent = p2;
    }
    // Find path from root to symbol node
    // left = 0, right = 1
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
    // Get code for character
    encodeSymbol(c){
        if(this.nodes[c] === undefined){ //character has not been transferred before
            return this.getPath(this.nodes[nyt]) + this.fixed[c];
        }
        else{
            return this.getPath(this.nodes[c]);
        }
    }
    //update the weight counts of non-leaf nodes
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
    //Main update sequence
    //1. Add new nodes if necessary
    //2. Increment affected node weights
    //3. Check if sibling property is violated
    //4. If violated, swap nodes and return to 3.
    update(c){
        var node = this.nodes[c];
        if(node === undefined){ //if new char, add new node
            node = this.nodes[nyt];
            node.left = new Node(node, nyt);
            node.right = new Node(node, c);
            node.right.weight = 1; //set child weight to 1 since this is first appearance of c
            this.weight_sum++;
            this.size++;
            node.symbol = null;
            this.nodes[nyt] = node.left;
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
            var q = new Queue();
            
            this.orderedNodes = []; // An array which tracks the reverse level-order nodes
            
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
                    else if(n.weight > high.weight){ //a swap will be required
                        low = n;
                        done = false; //We will need to check the tree again
                    }
                }
                else{
                    if(low.weight === n.weight){
                        low = n;
                    }
                    else{
                        this.swap(low, high); //swap low and high nodes.
                        this.recountWeights(this.root); //get correct node weights
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
    //print the tree in right to left level order
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
        /*
        console.log(output);
        for (const [key, value] of Object.entries(this.nodes)) {
            console.log(`${key}: ${value.weight}`);
        }
        */
    }
    //print what was last recorded to be right to left level order
    printLevel(){
        console.log("Nodes in level order");
        for(const n of this.orderedNodes){
            console.log(n.symbol, n.weight);
        }
    }
    //recursively draw the tree nodes to the canvas
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
    //clear the canvas.
    clear(){
        var ctx = c.getContext("2d");
        ctx.clearRect(0,0,WIDTH,HEIGHT);
    }
}
//encode text on various events
$("#ahc-input").on("change keyup paste", function(){
    encodeStr(document.getElementById("ahc-input"));
})
// fill output box
function displayCode(code){
    const p = document.getElementById("ahc-output");
    if(p.innerHTML === ""){
        p.innerHTML += code;
    }
    else{
        p.innerHTML += " " + code;
    }
}
// clear output box
function clearCode(){
    const p = document.getElementById("ahc-output");
    p.innerHTML = "";
}
// Encode the string in the given element.
function encodeStr(e){
    const str = e.value;
    nSym = 256;
    var tree = new Tree();
    //global_tree = tree; //debugging shortcut
    tree.init(nSym);
    clearCode();

    for(ch of str){
        var code = tree.encodeSymbol(ch);
        displayCode(code);
        tree.update(ch);
    }
    tree.clear();
    tree.draw(tree.root, WIDTH/2, 50, WIDTH/2);
    
}

//This is a test function that is no longer necessary
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
function auto_height(elem) {
    elem.style.height = "1px";
    elem.style.height = (elem.scrollHeight)+"px";
}