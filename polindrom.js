function polindrom(str){
    
    let str1="";
    for(let i=str.length-1;i>=0;i--){
    str1=str1+str.charAt(i);
    }
    if(str==str1){
        console.log("polindrom");
    }
    else{
        console.log("not a polindrom");
    }
}
let str="mam";
let str2="saranyaprakash"
polindrom(str);
polindrom(str2);