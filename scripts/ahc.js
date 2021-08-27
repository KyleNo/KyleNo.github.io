var c = document.getElementById("canvas");
const WIDTH = c.width;
const HEIGHT = c.height;
const new_sym = -1;
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
        this.root = null;
        this.size = 0;
        this.weight_sum = 0;
    }
}
function init(d, nSym){
    
}
function updateTree(tree, node){
    
}
function encodeSymbol(tree, c){
    
}
function encodingTest(){
    const str = "AABCDAABBBBDDDD";
    const nSym = 128;
    var tree = new Tree();
    var fixedLength = {};
    init(fixedLength, nSym);
    for(c of str){
        var code = encodeSymbol(tree, c);
        console.log(code);
        //updateTree()
    }
    
}