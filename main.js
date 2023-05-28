'use strict'

let gl // The webgl context.
let surface // A surface model
let shProgram // A shader program
let spaceball // A SimpleRotator object that lets the user rotate the view by mouse.

let webCamTexture, videoElem, background

let unitMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

function deg2rad(angle) {
  return (angle * Math.PI) / 180
}

// Constructor
function Model(name) {
  this.name = name
  this.iVertexBuffer = gl.createBuffer()
  this.iTextureBuffer = gl.createBuffer()
  this.count = 0

  this.BufferData = function (vertices) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW)

    this.count = vertices.length / 3
  }
  this.BufferData = function (vertices, texture) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW)

    gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texture), gl.STREAM_DRAW)
    gl.enableVertexAttribArray(shProgram.iTextureCoords)
    gl.vertexAttribPointer(shProgram.iTextureCoords, 2, gl.FLOAT, false, 0, 0)

    this.count = vertices.length / 3
  }

  this.Draw = function () {
    if (this.name == 'Background') {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer)
      gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0)
      gl.enableVertexAttribArray(shProgram.iAttribVertex)

      gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer)
      gl.vertexAttribPointer(shProgram.iTextureCoords, 2, gl.FLOAT, false, 0, 0)
      gl.enableVertexAttribArray(shProgram.iTextureCoords)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.count)
    } else {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer)
      gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0)
      gl.enableVertexAttribArray(shProgram.iAttribVertex)
      gl.drawArrays(gl.LINE_STRIP, 0, this.count)
    }
  }
}

// Constructor
function ShaderProgram(name, program) {
  this.name = name
  this.prog = program

  // Location of the attribute variable in the shader program.
  this.iAttribVertex = -1
  // Location of the uniform specifying a color for the primitive.
  this.iColor = -1
  // Location of the uniform matrix representing model view transformation.
  this.iModelViewMatrix = -1
  // Location of the uniform matrix representing projection transformation.
  this.iProjectionMatrix = -1

  this.Use = function () {
    gl.useProgram(this.prog)
  }
}

/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
  gl.clearColor(1, 1, 1, 1)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  /* Set the values of the projection transformation */
  //let projection = m4.perspective(Math.PI / 4, 2, 8, 12)

  /* Get the view matrix from the SimpleRotator object.*/
  let modelView = spaceball.getViewMatrix()

  let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7)
  let translateToPointZero = m4.translation(0, 0, -10)

  // let matAccum0 = m4.multiply(rotateToPointZero, modelView)
  // let matAccum1 = m4.multiply(translateToPointZero, matAccum0)

  // /* Multiply the projection matrix times the modelview matrix to give the
  //      combined transformation matrix, and send that to the shader program. */
  // let modelViewProjection = m4.multiply(projection, matAccum1)

  // gl.uniformMatrix4fv(
  //   shProgram.iModelViewProjectionMatrix,
  //   false,
  //   modelViewProjection
  // )

  /* Draw the six faces of a cube, with different colors. */
  //gl.uniform4fv(shProgram.iColor, [1, 1, 0, 1])
  // Set up the stereo camera system
  let convrg = 1000.0, // Convergence
    eyesep = 1.0, // Eye Separation
    asprat = 1.3, // Aspect Ratio
    fov = Math.PI / 3, // FOV along Y in degrees
    near = 9.0, // Near Clipping Distance
    far = 12.0 // Far Clipping Distance

  eyesep = document.getElementById('eyeSep').value
  fov = document.getElementById('fov').value
  near = document.getElementById('near').value - 0.0
  convrg = document.getElementById('convergence').value

  gl.uniform4fv(shProgram.iColor, [1, 1, 1, 1])
  gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, unitMatrix)
  gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, unitMatrix)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, videoElem)
  background.Draw()

  gl.uniform4fv(shProgram.iColor, [0, 0, 0, 1])

  let translateLeftEye = m4.translation(-eyesep / 2, 0, 0)
  let matAccum0 = m4.multiply(rotateToPointZero, modelView)
  let matAccum1 = m4.multiply(translateLeftEye, matAccum0)
  let matAccum2 = m4.multiply(translateToPointZero, matAccum1)

  // First pass for left eye, drawing red component only)

  gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, matAccum2)
  let matrLeftFrustum = ApplyLeftFrustum(convrg, eyesep, asprat, fov, near, far)
  gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, matrLeftFrustum)

  //gl.uniform4fv(shProgram.iColor, [1, 1, 0, 1])
  gl.colorMask(true, false, false, false)
  surface.Draw()
  gl.clear(gl.DEPTH_BUFFER_BIT)

  // Second pass for right eye, drawing blue+green component only

  let matrRightFrustum = ApplyRightFrustum(
    convrg,
    eyesep,
    asprat,
    fov,
    near,
    far
  )
  gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, matrRightFrustum)
  let translateRightEye = m4.translation(eyesep / 2, 0, 0)
  matAccum1 = m4.multiply(translateRightEye, matAccum0)
  matAccum2 = m4.multiply(translateToPointZero, matAccum1)

  // First pass for left eye, drawing red component only)

  gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, matAccum2)

  gl.colorMask(false, true, true, false)
  surface.Draw()
  gl.colorMask(true, true, true, true)
}

function ApplyLeftFrustum(convrg, eyesep, asprat, fov, near, far) {
  let top, bottom, left, right
  top = near * Math.tan(fov / 2)
  bottom = -top
  let a = asprat * Math.tan(fov / 2) * convrg
  let b = a - eyesep / 2
  let c = a + eyesep / 2
  left = (-b * near) / convrg
  right = (c * near) / convrg

  return m4.frustum(left, right, bottom, top, near, far)
}

function ApplyRightFrustum(convrg, eyesep, asprat, fov, near, far) {
  let top, bottom, left, right
  top = near * Math.tan(fov / 2)
  bottom = -top
  let a = asprat * Math.tan(fov / 2) * convrg
  let b = a - eyesep / 2
  let c = a + eyesep / 2
  left = (-c * near) / convrg
  right = (b * near) / convrg

  return m4.frustum(left, right, bottom, top, near, far)
}

function CreateSurfaceData() {
  let vertexList = []
  let deltaV0 = 0.03
  let deltaPhi = 0.03
  let R = 2
  let n = 7
  let a = 3
  let zoom = 2

  //let step = 0.01
  for (let v0 = 0; v0 <= Math.PI; v0 += deltaV0) {
    for (let phi = 0; phi <= 2 * Math.PI; phi += deltaPhi) {
      let x = calcX(v0, phi, a, R, n)
      let y = calcY(v0, phi, a, R, n)
      let z = calcZ(v0, R)
      vertexList.push(x / zoom, y / zoom, z / zoom)

      x = calcX(v0 + deltaV0, phi, a, R, n)
      y = calcY(v0 + deltaV0, phi, a, R, n)
      z = calcZ(v0 + deltaV0, R)
      vertexList.push(x / zoom, y / zoom, z / zoom)
    }
  }
  return vertexList
}

function calcX(v0, phi, a, R, n) {
  return (
    (R * Math.cos(v0) + a * (1 - Math.sin(v0)) * Math.cos(n * phi)) *
    Math.cos(phi)
  )
}

function calcY(v0, phi, a, R, n) {
  return (
    (R * Math.cos(v0) + a * (1 - Math.sin(v0)) * Math.cos(n * phi)) *
    Math.sin(phi)
  )
}

function calcZ(v0, R) {
  return R * Math.sin(v0)
}

/* Initialize the WebGL context. Called from init() */
function initGL() {
  let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource)

  shProgram = new ShaderProgram('Basic', prog)
  shProgram.Use()

  shProgram.iAttribVertex = gl.getAttribLocation(prog, 'vertex')
  shProgram.iModelViewMatrix = gl.getUniformLocation(prog, 'ModelViewMatrix')
  shProgram.iProjectionMatrix = gl.getUniformLocation(prog, 'ProjectionMatrix')
  shProgram.iColor = gl.getUniformLocation(prog, 'colorU')
  shProgram.iTextureCoords = gl.getAttribLocation(prog, 'textureCoords')

  surface = new Model('Surface')
  surface.BufferData(CreateSurfaceData())

  background = new Model('Background')
  background.BufferData(
    [-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0],
    [0, 0, 1, 0, 0, 1, 1, 1]
  )

  gl.enable(gl.DEPTH_TEST)
}

/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
  let vsh = gl.createShader(gl.VERTEX_SHADER)
  gl.shaderSource(vsh, vShader)
  gl.compileShader(vsh)
  if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
    throw new Error('Error in vertex shader:  ' + gl.getShaderInfoLog(vsh))
  }
  let fsh = gl.createShader(gl.FRAGMENT_SHADER)
  gl.shaderSource(fsh, fShader)
  gl.compileShader(fsh)
  if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
    throw new Error('Error in fragment shader:  ' + gl.getShaderInfoLog(fsh))
  }
  let prog = gl.createProgram()
  gl.attachShader(prog, vsh)
  gl.attachShader(prog, fsh)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error('Link error in program:  ' + gl.getProgramInfoLog(prog))
  }
  return prog
}

/**
 * initialization function that will be called when the page has loaded
 */
async function init() {
  let canvas
  try {
    canvas = document.getElementById('webglcanvas')
    gl = canvas.getContext('webgl')
    if (!gl) {
      throw 'Browser does not support WebGL'
    }
  } catch (e) {
    document.getElementById('canvas-holder').innerHTML =
      '<p>Sorry, could not get a WebGL graphics context.</p>'
    return
  }
  try {
    initGL() // initialize the WebGL graphics context
  } catch (e) {
    document.getElementById('canvas-holder').innerHTML =
      '<p>Sorry, could not initialize the WebGL graphics context: ' + e + '</p>'
    return
  }

  spaceball = new TrackballRotator(canvas, draw, 0)
  await openCam()
  window.setInterval(() => draw(), 60)
}

async function CreateWebCamTexture(width, height) {
  // Create a texture
  let textureID = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, textureID)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    width,
    height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null
  )

  return textureID
}

async function openCam() {
  let All_mediaDevices = navigator.mediaDevices
  if (!All_mediaDevices || !All_mediaDevices.getUserMedia) {
    console.log('getUserMedia() not supported.')
    return
  }
  await All_mediaDevices.getUserMedia({
    audio: false,
    video: true,
  })
    .then(function (vidStream) {
      videoElem = document.getElementById('webCam')
      if ('srcObject' in videoElem) {
        videoElem.srcObject = vidStream
      } else {
        videoElem.src = window.URL.createObjectURL(vidStream)
      }
      let width = videoElem.getAttributeNode('width').value
      let height = videoElem.getAttributeNode('height').value
      webCamTexture = CreateWebCamTexture(width, height)
      videoElem.onloadedmetadata = function (e) {
        videoElem.play()
      }
    })
    .catch(function (e) {
      console.log(e.name + ': ' + e.message)
    })
}
