function arra(arr) {
    


let max = 0;

for (let i in arr) {
    if (arr[i] > arr[max]) {
        arr[max] = arr[i];
    }
}
console.log(arr[max]);
}

let arr = [1, 9, 3, 4];
arra(arr);
let sss=[3,6,8,9]
arra(sss)
  