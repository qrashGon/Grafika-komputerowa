var gl;
var shaderProgram;
var uPMatrix;
var vertexPositionBuffer;
var vertexColorBuffer;
var vertexNormalBuffer;


function MatrixMul(a,b) //Mno¿enie macierzy
{
    c = [
        0,0,0,0,
        0,0,0,0,
        0,0,0,0,
        0,0,0,0
    ]
    for(let i=0;i<4;i++) {
        for(let j=0;j<4;j++) {
            c[i*4+j] = 0.0;
            for(let k=0;k<4;k++) {
                c[i*4+j]+= a[i*4+k] * b[k*4+j];
            }
        }
    }
    return c;
}

function createRect2(p1x,p1y,p1z,p2x,p2y,p2z,p3x,p3y,p3z,p4x,p4y,p4z)
{
    let vertexPosition = [
        p1x,p1y,p1z, p2x,p2y,p2z, p4x,p4y,p4z,  //Pierwszy trójk¹t
        p1x,p1y,p1z, p4x,p4y,p4z, p3x,p3y,p3z   //Drugi trójk¹t
    ];

    return vertexPosition;
}


function createRectCoords(mu,mv,dau,dav,dbu,dbv)
{
    p1u = mu;             p1v = mv;
    p2u = mu + dau;       p2v = mv + dav;
    p3u = mu + dbu;       p3v = mv + dbv;
    p4u = mu + dau + dbu; p4v = mv + dav + dbv;

    let vertexCoord = [
        p1u,p1v, p2u,p2v, p4u,p4v,  //Pierwszy trójk¹t
        p1u,p1v, p4u,p4v, p3u,p3v   //Drugi trójk¹t
    ];

    return vertexCoord;
}

function createRectCoords2(p1u,p1v,p2u,p2v,p3u,p3v,p4u,p4v)
{
    let vertexCoord = [
        p1u,p1v, p2u,p2v, p4u,p4v,  //Pierwszy trójk¹t
        p1u,p1v, p4u,p4v, p3u,p3v   //Drugi trójk¹t
    ];

    return vertexCoord;
}

function createRectColor(r,g,b)
{
    let vertexColor = [
        r,g,b, r,g,b, r,g,b,  //Pierwszy trójk¹t
        r,g,b, r,g,b, r,g,b   //Drugi trójk¹t
    ];

    return vertexColor;
}


function createNormal(p1x,p1y,p1z,p2x,p2y,p2z,p3x,p3y,p3z) //Wyznaczenie wektora normalnego dla trójk¹ta
{
    let v1x = p2x - p1x;
    let v1y = p2y - p1y;
    let v1z = p2z - p1z;

    let v2x = p3x - p1x;
    let v2y = p3y - p1y;
    let v2z = p3z - p1z;

    let v3x =  v1y*v2z - v1z*v2y;
    let v3y =  v1z*v2x - v1x*v2z;
    let v3z =  v1x*v2y - v1y*v2x;

    vl = Math.sqrt(v3x*v3x+v3y*v3y+v3z*v3z); //Obliczenie d³ugoœci wektora

    v3x/=vl; //Normalizacja na zakreœ -1 1
    v3y/=vl;
    v3z/=vl;

    let vertexNormal = [v3x,v3y,v3z, v3x,v3y,v3z, v3x,v3y,v3z];
    return vertexNormal;
}

function startGL()
{
    //alert("StartGL");
    let canvas = document.getElementById("canvas3D"); //wyszukanie obiektu w strukturze strony
    gl = canvas.getContext("experimental-webgl"); //pobranie kontekstu OpenGL'u z obiektu canvas
    gl.viewportWidth = canvas.width; //przypisanie wybranej przez nas rozdzielczoœci do systemu OpenGL
    gl.viewportHeight = canvas.height;

    //Kod shaderów
    const vertextShaderSource = ` //Znak akcentu z przycisku tyldy - na lewo od przycisku 1 na klawiaturze
    precision highp float;
    attribute vec3 aVertexPosition; 
    attribute vec3 aVertexColor;
    attribute vec2 aVertexCoords;
    attribute vec3 aVertexNormal;
    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;
    varying vec3 vPos;
    varying vec3 vColor;
    varying vec2 vTexUV;
    varying vec3 vNormal;
    void main(void) {
      gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0); //Dokonanie transformacji po³o¿enia punktów z przestrzeni 3D do przestrzeni obrazu (2D)
      vColor = aVertexColor;
      vPos = aVertexPosition;
      vTexUV = aVertexCoords;
      vNormal = aVertexNormal;
    }
  `;
    const fragmentShaderSource = `
    precision highp float;
    varying vec3 vColor;
    varying vec3 vPos;
    varying vec2 vTexUV;
    uniform sampler2D uSampler;
    varying vec3 vNormal;
    uniform vec3 uLightPosition;
    void main(void) {
      vec3 lightDirection = normalize(uLightPosition - vPos);
       float brightness = max(dot(vNormal,lightDirection), 0.0);
      //gl_FragColor = vec4(vColor,1.0); //Ustalenie sta³ego koloru wszystkich punktów sceny
      //gl_FragColor = texture2D(uSampler,vTexUV); //Odczytanie punktu tekstury i przypisanie go jako koloru danego punktu renderowaniej figury
    //gl_FragColor = vec4((vNormal+vec3(1.0,1.0,1.0))/2.0,1.0); 
    gl_FragColor = clamp(texture2D(uSampler,vTexUV) * vec4(brightness,brightness,brightness,1.0),0.0,1.0);
    }
  `;
    let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER); //Stworzenie obiektu shadera
    let vertexShader   = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource); //Podpiêcie Ÿród³a kodu shader
    gl.shaderSource(vertexShader, vertextShaderSource);
    gl.compileShader(fragmentShader); //Kompilacja kodu shader
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) { //Sprawdzenie ewentualnych b³edów kompilacji
        alert(gl.getShaderInfoLog(fragmentShader));
        return null;
    }
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(vertexShader));
        return null;
    }

    shaderProgram = gl.createProgram(); //Stworzenie obiektu programu
    gl.attachShader(shaderProgram, vertexShader); //Podpiêcie obu shaderów do naszego programu wykonywanego na karcie graficznej
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) alert("Could not initialise shaders");  //Sprawdzenie ewentualnych b³edów

    //Opis sceny 3D, po³o¿enie punktów w przestrzeni 3D w formacie X,Y,Z
    let vertexPosition = [];

    let stepElevation = 90/6;
    let stepAngle = 360/36;
    let rad = [300.0 , 1.0 , 1.0 , 1.0 , 1.0 , 10.0 , 8.0 , 3.0 , 3.0 ];
    let dst = [0.0 , 300.0 , 330.0 , 360.0 , 390.0 , 450.0 , 525.0 , 575.0 , 600.0 ];

    let i=0;
    for (i=0; i<9; i+=1)
    {
        for(let elevation=-90; elevation< 90; elevation+= stepElevation)
        {
            let radiusXZ = rad[i]*Math.cos(elevation*Math.PI/180);
            let radiusY  = rad[i]*Math.sin(elevation*Math.PI/180);

            let radiusXZ2 = rad[i]*Math.cos((elevation+stepElevation)*Math.PI/180);
            let radiusY2  = rad[i]*Math.sin((elevation+stepElevation)*Math.PI/180);

            for(let angle = 0; angle < 360; angle+= stepAngle)
            {

                let px1 = dst[i]+radiusXZ*Math.cos(angle*Math.PI/180);
                let py1 = radiusY;
                let pz1 = dst[i]+radiusXZ*Math.sin(angle*Math.PI/180);

                let px2 = dst[i]+radiusXZ*Math.cos((angle+stepAngle)*Math.PI/180);
                let py2 = radiusY;
                let pz2 = dst[i]+radiusXZ*Math.sin((angle+stepAngle)*Math.PI/180);

                let px3 = dst[i]+radiusXZ2*Math.cos(angle*Math.PI/180);
                let py3 = radiusY2;
                let pz3 = dst[i]+radiusXZ2*Math.sin(angle*Math.PI/180);

                let px4 = dst[i]+radiusXZ2*Math.cos((angle+stepAngle)*Math.PI/180);
                let py4 = radiusY2;
                let pz4 = dst[i]+radiusXZ2*Math.sin((angle+stepAngle)*Math.PI/180);

                vertexPosition.push(...createRect2(px1,py1,pz1,px2,py2,pz2,px3,py3,pz3,px4,py4,pz4)); // Œciana XZ
            }
        }
    }


    vertexPositionBuffer = gl.createBuffer(); //Stworzenie tablicy w pamieci karty graficznej
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPosition), gl.STATIC_DRAW);
    vertexPositionBuffer.itemSize = 3; //zdefiniowanie liczby wspó³rzednych per wierzcho³ek
    vertexPositionBuffer.numItems = vertexPosition.length/9; //Zdefinoiowanie liczby punktów w naszym buforze

    //Opis sceny 3D, kolor ka¿dego z wierzcho³ków
    let vertexColor = [];
    for(let j=0; j<9; j+=1) {
        for(let elevation=-90; elevation< 90; elevation+= stepElevation) {
            for(let angle = 0; angle < 360; angle+= stepAngle) {
                vertexColor.push(...createRectColor(1.0,1.0,1.0));
            }
        }
    }
    vertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColor), gl.STATIC_DRAW);
    vertexColorBuffer.itemSize = 3;
    vertexColorBuffer.numItems = vertexColor.length/9;

    let vertexCoords = [];

    for(let elevation=-90; elevation< 90; elevation+= stepElevation) 
    {
        for(let angle = 0; angle < 360; angle+= stepAngle)
        {
            vertexCoords.push(...createRectCoords2(0.0, 0.0,       0.1111, 0.0,    0.0, 1.0,0.1111, 1.0));
        }
    }
    for(let elevation=-90; elevation< 90; elevation+= stepElevation)
    {
        for(let angle = 0; angle < 360; angle+= stepAngle)
        {
            vertexCoords.push(...createRectCoords2( 0.1111, 0.0,    0.2222, 0.0,    0.1111, 1.0, 0.2222, 1.0));
        }
    }
    for(let elevation=-90; elevation< 90; elevation+= stepElevation) 
    {
        for(let angle = 0; angle < 360; angle+= stepAngle)
        {
            vertexCoords.push(...createRectCoords2(0.2222, 0.0,    0.3333, 0.0,    0.2222, 1.0,  0.3333, 1.0));
        }
    }
    for(let elevation=-90; elevation< 90; elevation+= stepElevation) 
    {
        for(let angle = 0; angle < 360; angle+= stepAngle)
        {
            vertexCoords.push(...createRectCoords2(0.3333, 0.0,    0.4444, 0.0,    0.3333, 1.0, 0.4444, 1.0));
        }
    }
    for(let elevation=-90; elevation< 90; elevation+= stepElevation) 
    {
        for(let angle = 0; angle < 360; angle+= stepAngle)
        {
            vertexCoords.push(...createRectCoords2(0.4444, 0.0,    0.5555, 0.0,    0.4444, 1.0, 0.5555, 1.0));
        }
    }
    for(let elevation=-90; elevation< 90; elevation+= stepElevation) 
    {
        for(let angle = 0; angle < 360; angle+= stepAngle)
        {
            vertexCoords.push(...createRectCoords2( 0.5555, 0.0,    0.6666, 0.0,    0.5555, 1.0, 0.6666, 1.0));
        }
    }
    for(let elevation=-90; elevation< 90; elevation+= stepElevation) 
    {
        for(let angle = 0; angle < 360; angle+= stepAngle)
        {
            vertexCoords.push(...createRectCoords2(0.6666, 0.0,    0.7777, 0.0,    0.6666, 1.0,0.7777, 1.0));
        }
    }
    for(let elevation=-90; elevation< 90; elevation+= stepElevation)
    {
        for(let angle = 0; angle < 360; angle+= stepAngle)
        {
            vertexCoords.push(...createRectCoords2(0.8888, 0.0,    0.9999, 0.0,    0.8888, 1.0,  0.9999, 1.0));
        }
    }
    for(let elevation=-90; elevation< 90; elevation+= stepElevation) 
    {
        for(let angle = 0; angle < 360; angle+= stepAngle)
        {
            vertexCoords.push(...createRectCoords2( 0.7777, 0.0,    0.8888, 0.0,    0.7777, 1.0,0.8888, 1.0));
        }
    }


    vertexCoordsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexCoordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexCoords), gl.STATIC_DRAW);
    vertexCoordsBuffer.itemSize = 2;
    vertexCoordsBuffer.numItems = vertexCoords.length/6;

    let vertexNormal = [];

    for(let i=0;i<vertexPosition.length/9; i++)
    {
        vertexNormal.push(...createNormal(vertexPosition[i*9+0],vertexPosition[i*9+1],vertexPosition[i*9+2],
            vertexPosition[i*9+3],vertexPosition[i*9+4],vertexPosition[i*9+5],
            vertexPosition[i*9+6],vertexPosition[i*9+7],vertexPosition[i*9+8]));
    }

    vertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormal), gl.STATIC_DRAW);
    vertexNormalBuffer.itemSize = 3;
    vertexNormalBuffer.numItems = vertexNormal.length/9;


    textureBuffer = gl.createTexture();
    var textureImg = new Image();
    textureImg.onload = function() { //Wykonanie kodu automatycznie po za³adowaniu obrazka
        gl.bindTexture(gl.TEXTURE_2D, textureBuffer);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureImg); //Faktyczne za³adowanie danych obrazu do pamieci karty graficznej
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Ustawienie parametrów próbkowania tekstury
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    textureImg.src="PlanetTex.png"; //Nazwa obrazka

    //Macierze opisuj¹ce po³o¿enie wirtualnej kamery w przestrzenie 3D
    let aspect = gl.viewportWidth/gl.viewportHeight;
    let fov = 45.0 * Math.PI / 180.0; //Okreœlenie pola widzenia kamery
    let zFar = 2500.0; //Ustalenie zakresów renderowania sceny 3D (od obiektu najbli¿szego zNear do najdalszego zFar)
    let zNear = 0.1;
    uPMatrix = [
        1.0/(aspect*Math.tan(fov/2)),0                           ,0                         ,0                            ,
        0                         ,1.0/(Math.tan(fov/2))         ,0                         ,0                            ,
        0                         ,0                           ,-(zFar+zNear)/(zFar-zNear)  , -1,
        0                         ,0                           ,-(2*zFar*zNear)/(zFar-zNear) ,0.0,
    ];

    Tick();
}

//let angle = 45.0; //Macierz transformacji œwiata - okreœlenie po³o¿enia kamery
var angleZ = 0.0;
var angleY = -5.0;
var angleX = 0.0;
var tz = -5.0;
let Step=5;

let TranslateX = -310.0;
let TranslateY = -0.0;
let TranslateZ = -310.0;

var lightX = 0;
var lightY = 0;
var lightZ = 0;

function Move()
{
    let uMVMatrix = [
        1,0,0,0, //Macierz jednostkowa
        0,1,0,0,
        0,0,1,0,
        0,0,-700,1
    ];

    let uMVRotZ = [
        +Math.cos(angleZ*Math.PI/180.0),+Math.sin(angleZ*Math.PI/180.0),0,0,
        -Math.sin(angleZ*Math.PI/180.0),+Math.cos(angleZ*Math.PI/180.0),0,0,
        0,0,1,0,
        0,0,0,1
    ];

    let uMVRotY = [
        +Math.cos(angleY*Math.PI/180.0),0,-Math.sin(angleY*Math.PI/180.0),0,
        0,1,0,0,
        +Math.sin(angleY*Math.PI/180.0),0,+Math.cos(angleY*Math.PI/180.0),0,
        0,0,0,1
    ];

    let uMVRotX = [
        1,0,0,0,
        0,+Math.cos(angleX*Math.PI/180.0),+Math.sin(angleX*Math.PI/180.0),0,
        0,-Math.sin(angleX*Math.PI/180.0),+Math.cos(angleX*Math.PI/180.0),0,
        0,0,0,1
    ];

    let uMVTranslateX = [
        1,0,0,0,
        0,1,0,0,
        0,0,1,0,
        TranslateX,0,0,1
    ];

    let uMVTranslateY = [
        1,0,0,0,
        0,1,0,0,
        0,0,1,0,
        0,TranslateY,0,1
    ];

    let uMVTranslateZ = [
        1,0,0,0,
        0,1,0,0,
        0,0,1,0,
        0,0,TranslateZ,1
    ];

    uMVMatrix = MatrixMul(uMVMatrix,uMVTranslateX);
    uMVMatrix = MatrixMul(uMVMatrix,uMVTranslateY);
    uMVMatrix = MatrixMul(uMVMatrix,uMVTranslateZ);
    uMVMatrix = MatrixMul(uMVMatrix,uMVRotX);
    uMVMatrix = MatrixMul(uMVMatrix,uMVRotY);
    uMVMatrix = MatrixMul(uMVMatrix,uMVRotZ);
    return uMVMatrix;
}

function Tick()
{
    let uMVMatrix=Move();
    //alert(uPMatrix);

    //Render Scene
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clearColor(0.0,0.0,0.0,1.0); //Wyczyszczenie obrazu kolorem czerwonym
    gl.clearDepth(1.0);             //Wyczyœcienie bufora g³ebi najdalszym planem
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(shaderProgram)   //U¿ycie przygotowanego programu shaderowego

    gl.enable(gl.DEPTH_TEST);           // W³¹czenie testu g³êbi - obiekty bli¿sze maj¹ przykrywaæ obiekty dalsze
    gl.depthFunc(gl.LEQUAL);            //

    gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, "uPMatrix"), false, new Float32Array(uPMatrix)); //Wgranie macierzy kamery do pamiêci karty graficznej
    gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, "uMVMatrix"), false, new Float32Array(uMVMatrix));

    gl.enableVertexAttribArray(gl.getAttribLocation(shaderProgram, "aVertexPosition"));  //Przekazanie po³o¿enia
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.vertexAttribPointer(gl.getAttribLocation(shaderProgram, "aVertexPosition"), vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(gl.getAttribLocation(shaderProgram, "aVertexColor"));  //Przekazanie kolorów
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.vertexAttribPointer(gl.getAttribLocation(shaderProgram, "aVertexColor"), vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(gl.getAttribLocation(shaderProgram, "aVertexCoords"));  //Pass the geometry
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexCoordsBuffer);
    gl.vertexAttribPointer(gl.getAttribLocation(shaderProgram, "aVertexCoords"), vertexCoordsBuffer.itemSize, gl.FLOAT, false, 0, 0);


    gl.enableVertexAttribArray(gl.getAttribLocation(shaderProgram, "aVertexNormal"));  //Przekazywanie wektorów normalnych
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
    gl.vertexAttribPointer(gl.getAttribLocation(shaderProgram, "aVertexNormal"), vertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.uniform3f(gl.getUniformLocation(shaderProgram, "uLightPosition"),lightX,lightY,lightZ);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureBuffer);
    gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"), 0);

    gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numItems*vertexPositionBuffer.itemSize); //Faktyczne wywo³anie rendrowania

    setTimeout(Tick,25);
}
function handlekeydown(e)
{
    if(event.keyCode===87) 
    {
        TranslateZ += Step*Math.cos(angleY*Math.PI/180.0);
        TranslateX -= Step*Math.sin(angleY*Math.PI/180.0);
    }
    if(event.keyCode===83) 
    {
        TranslateZ -= Step*Math.cos(angleY*Math.PI/180.0);
        TranslateX += Step*Math.sin(angleY*Math.PI/180.0);
    }
    if(event.keyCode===68) 
    {
        TranslateZ -= Step*Math.sin(angleY*Math.PI/180.0);
        TranslateX -= Step*Math.cos(angleY*Math.PI/180.0);
    }
    if(event.keyCode===65)
    {
        TranslateZ += Step*Math.sin(angleY*Math.PI/180.0);
        TranslateX += Step*Math.cos(angleY*Math.PI/180.0);
    }

    //alert(e.keyCode);
    //alert(angleX);
}
