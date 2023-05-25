'use strict'

let gl // The webgl context.
let surface // A surface model
let shProgram // A shader program
let spaceball // A SimpleRotator object that lets the user rotate the view by mouse.
let timestamp = 0
let orientationRotateMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

let sound = { audioCtx: null, source: null, panner: null, filter: null }
let audioSource = null
let sphere
let sphereRadius = 0.5,
  sphereWidth = 20,
  sphereHeight = 20
let sphereX = 0,
  sphereY = 0,
  sphereZ = 0

function deg2rad(angle) {
  return (angle * Math.PI) / 180
}

// Constructor
function Model(name) {
  this.name = name
  this.iVertexBuffer = gl.createBuffer()
  this.count = 0

  this.BufferData = function (vertices) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW)

    this.count = vertices.length / 3
  }

  this.Draw = function () {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer)
    gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(shProgram.iAttribVertex)

    //gl.uniform4fv(shProgram.iColor, [0, 0, 0, 1])
    gl.drawArrays(gl.LINE_STRIP, 0, this.count)
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

  if (sound.panner) {
    sound.panner.positionX.value = parseFloat(sphereX)
    sound.panner.positionY.value = parseFloat(sphereY)
    sound.panner.positionZ.value = parseFloat(sphereZ)
  }

  /* Set the values of the projection transformation */
  let projection = m4.perspective(Math.PI / 8, 1, 8, 12)

  /* Get the view matrix from the SimpleRotator object.*/
  let modelView = spaceball.getViewMatrix()

  let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7)
  let translateToPointZero = m4.translation(0, 0, -10)

  // let matAccum0 = m4.multiply(rotateToPointZero, modelView)
  // let matAccum1 = m4.multiply(translateToPointZero, matAccum0)

  // /* Multiply the projection matrix times the modelview matrix to give the
  //      combined transformation matrix, and send that to the shader program. */
  //let modelViewProjection = m4.multiply(projection, matAccum1)

  // gl.uniformMatrix4fv(
  //   shProgram.iModelViewProjectionMatrix,
  //   false,
  //   modelViewProjection
  // )

  /* Draw the six faces of a cube, with different colors. */
  //gl.uniform4fv(shProgram.iColor, [1, 1, 0, 1])

  let matAccum0 = m4.multiply(rotateToPointZero, modelView)
  //let matAccum3 = m4.multiply(orientationRotateMatrix, matAccum0)
  let matAccum2 = m4.multiply(translateToPointZero, matAccum0)
  let matAccum3 = m4.multiply(orientationRotateMatrix, matAccum2)

  gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, matAccum3)
  gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, projection)

  //gl.uniform4fv(shProgram.iColor, [1, 1, 0, 1])
  //gl.colorMask(true, false, false, false)
  gl.uniform4fv(shProgram.iColor, [1, 0, 0, 1])
  sphere.Draw()
  gl.clear(gl.DEPTH_BUFFER_BIT)

  matAccum0 = m4.multiply(rotateToPointZero, modelView)
  matAccum3 = m4.multiply(translateToPointZero, matAccum0)
  gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, matAccum3)
  gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, projection)
  gl.uniform4fv(shProgram.iColor, [1, 1, 0, 1])
  surface.Draw()
}

// function ApplyLeftFrustum(convrg, eyesep, asprat, fov, near, far) {
//   let top, bottom, left, right
//   top = near * Math.tan(fov / 2)
//   bottom = -top
//   let a = asprat * Math.tan(fov / 2) * convrg
//   let b = a - eyesep / 2
//   let c = a + eyesep / 2
//   left = (-b * near) / convrg
//   right = (c * near) / convrg

//   return m4.frustum(left, right, bottom, top, near, far)
// }

// function ApplyRightFrustum(convrg, eyesep, asprat, fov, near, far) {
//   let top, bottom, left, right
//   top = near * Math.tan(fov / 2)
//   bottom = -top
//   let a = asprat * Math.tan(fov / 2) * convrg
//   let b = a - eyesep / 2
//   let c = a + eyesep / 2
//   left = (-c * near) / convrg
//   right = (b * near) / convrg

//   return m4.frustum(left, right, bottom, top, near, far)
// }

function CreateSurfaceData() {
  let vertexList = []
  let deltaV0 = 0.03
  let deltaPhi = 0.03
  let R = 2
  let n = 7
  let a = 3
  let zoom = 3

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
  shProgram.iColor = gl.getUniformLocation(prog, 'color')

  surface = new Model('Surface')
  surface.BufferData(CreateSurfaceData())

  sphere = new Model('Sphere')
  sphere.BufferData(
    createSphereCoordinates(sphereRadius, sphereWidth, sphereHeight)
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
function init() {
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

  draw()
  ReadGyroscope()
  beginAudio()
}

function ReadGyroscope() {
  let sensor = new Gyroscope({ frequency: 10 })
  sensor.addEventListener('reading', (e) => {
    let NS2S = 1.0 / 1000000000.0
    document.getElementById('velocity_x').innerHTML =
      'Angular velocity along the X-axis ' + sensor.x
    document.getElementById('velocity_y').innerHTML =
      'Angular velocity along the Y-axis ' + sensor.y
    document.getElementById('velocity_z').innerHTML =
      'Angular velocity along the Z-axis ' + sensor.z
    let current = e.timeStamp
    let dt = (current - timestamp) * NS2S
    let x = sensor.x * 50
    let y = sensor.y * 50
    let z = sensor.z * 50

    sphereX += sensor.x
    sphereY += sensor.y
    sphereZ += sensor.z

    let eps = 0.3
    let angSpeed = Math.sqrt(x * x + y * y + z * z)
    // if (angSpeed > eps) {
    //   x /= angSpeed
    //   y /= angSpeed
    //   z /= angSpeed
    // }
    let thetaOverTwo = (angSpeed * dt) / 2.0
    let sinTheta = Math.sin(thetaOverTwo)
    let cosTheta = Math.cos(thetaOverTwo)

    let deltaRotVec = Array(4)
    deltaRotVec[0] = sinTheta * x
    deltaRotVec[1] = sinTheta * y
    deltaRotVec[2] = sinTheta * z
    deltaRotVec[3] = cosTheta

    let deltaRotationMatrix = Array(16)

    timestamp = current
    getRotationMatrixFromVector(deltaRotationMatrix, deltaRotVec)
    orientationRotateMatrix = m4.multiply(
      orientationRotateMatrix,
      deltaRotationMatrix
    )
    draw()
  })
  sensor.onerror = (e) => {
    //alert(e.error.name, e.error.message)
  }
  sensor.start()
}

function getRotationMatrixFromVector(R, rotationVector) {
  let q0,
    q1,
    q2,
    q3,
    sq_q1,
    sq_q2,
    sq_q3,
    q1_q2,
    q1_q3,
    q1_q0,
    q2_q0,
    q2_q3,
    q3_q0
  q1 = rotationVector[0]
  q2 = rotationVector[1]
  q3 = rotationVector[2]
  if (rotationVector.length >= 4) {
    q0 = rotationVector[3]
  } else {
    q0 = 1 - q1 * q1 - q2 * q2 - q3 * q3
    q0 = q0 > 0 ? Math.sqrt(q0) : 0
  }
  sq_q1 = 2 * q1 * q1
  sq_q2 = 2 * q2 * q2
  sq_q3 = 2 * q3 * q3
  q1_q2 = 2 * q1 * q2
  q3_q0 = 2 * q3 * q0
  q1_q3 = 2 * q1 * q3
  q2_q0 = 2 * q2 * q0
  q2_q3 = 2 * q2 * q3
  q1_q0 = 2 * q1 * q0
  if (R.length == 9) {
    R[0] = 1 - sq_q2 - sq_q3
    R[1] = q1_q2 - q3_q0
    R[2] = q1_q3 + q2_q0
    R[3] = q1_q2 + q3_q0
    R[4] = 1 - sq_q1 - sq_q3
    R[5] = q2_q3 - q1_q0
    R[6] = q1_q3 - q2_q0
    R[7] = q2_q3 + q1_q0
    R[8] = 1 - sq_q1 - sq_q2
  } else if (R.length == 16) {
    R[0] = 1 - sq_q2 - sq_q3
    R[1] = q1_q2 - q3_q0
    R[2] = q1_q3 + q2_q0
    R[3] = 0.0
    R[4] = q1_q2 + q3_q0
    R[5] = 1 - sq_q1 - sq_q3
    R[6] = q2_q3 - q1_q0
    R[7] = 0.0
    R[8] = q1_q3 - q2_q0
    R[9] = q2_q3 + q1_q0
    R[10] = 1 - sq_q1 - sq_q2
    R[11] = 0.0
    R[12] = R[13] = R[14] = 0.0
    R[15] = 1.0
  }
}

function setupAudio() {
  audioSource = document.getElementById('audio')

  audioSource.addEventListener('play', () => {
    if (!sound.audioCtx) {
      sound.audioCtx = new window.AudioContext()
      sound.source = sound.audioCtx.createMediaElementSource(audioSource)
      sound.panner = sound.audioCtx.createPanner()
      sound.filter = sound.audioCtx.createBiquadFilter()
      sound.filter.type = 'bandpass'
      sound.filter.detune.value = 10
      sound.filter.frequency.value = 700

      sound.source.connect(sound.panner)
      sound.panner.connect(sound.filter)
      sound.filter.connect(sound.audioCtx.destination)
    }
    sound.audioCtx.resume()
  })

  audioSource.addEventListener('pause', () => {
    if (sound.audioCtx) {
      sound.audioCtx.suspend()
    }
  })
}

function beginAudio() {
  setupAudio()

  let filterCheck = document.getElementById('filterCheck')

  filterCheck.addEventListener('change', () => {
    if (filterCheck.checked) {
      sound.panner.disconnect()
      sound.panner.connect(sound.filter)
      sound.filter.connect(sound.audioCtx.destination)
    } else {
      sound.panner.disconnect()
      sound.panner.connect(sound.audioCtx.destination)
    }
  })
  audioSource.play()
}

function createSphereCoordinates(radius, widthSegments, heightSegments) {
  let coordinates = []

  for (var i = 0; i <= heightSegments; i++) {
    let theta = (i * Math.PI) / heightSegments
    let sinTheta = Math.sin(theta)
    let cosTheta = Math.cos(theta)

    for (var j = 0; j <= widthSegments; j++) {
      let phi = (j * 2 * Math.PI) / widthSegments
      let sinPhi = Math.sin(phi)
      let cosPhi = Math.cos(phi)

      let x = cosPhi * sinTheta
      let y = cosTheta
      let z = sinPhi * sinTheta

      coordinates.push(x * radius, y * radius, z * radius)
    }
  }

  return coordinates
}
