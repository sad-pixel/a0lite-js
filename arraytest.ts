let array3D = Array.from({ length: 8 }, () => 
    Array.from({ length: 8 }, () => 
        Array(8).fill(0)
    )
);

console.log(array3D[0][0][0]);
array3D[0][1][2] = 5;
console.log(array3D[0][1][2]
);