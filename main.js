'use strict'

let gl // The webgl context.
let surface // A surface model
let shProgram // A shader program
let spaceball // A SimpleRotator object that lets the user rotate the view by mouse.
let timestamp = 0
let orientationRotateMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
let accumTimes = 0

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
  accumTimes += 1
  gl.clearColor(0, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  /* Set the values of the projection transformation */
  let projection = m4.perspective(Math.PI / 8, 1, 8, 12)

  /* Get the view matrix from the SimpleRotator object.*/
  let modelView = spaceball.getViewMatrix()
  console.log(modelView)

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
  //let matAccum1 = m4.multiply(translateLeftEye, matAccum3)
  let matAccum3 = m4.multiply(orientationRotateMatrix, matAccum0)
  let matAccum2 = m4.multiply(translateToPointZero, matAccum3)
  console.log(matAccum0)

  document.getElementById('matrix0').innerHTML =
    'Matrix 0 elem ' + orientationRotateMatrix[0]
  document.getElementById('matrix1').innerHTML =
    'Matrix 1 elem ' + orientationRotateMatrix[1]
  document.getElementById('matrix2').innerHTML =
    'Matrix 2 elem ' + orientationRotateMatrix[2]
  document.getElementById('matrix3').innerHTML =
    'Matrix 3 elem ' + orientationRotateMatrix[3]
  document.getElementById('matrix4').innerHTML =
    'Matrix 4 elem ' + orientationRotateMatrix[4]
  document.getElementById('matrix5').innerHTML =
    'Matrix 5 elem ' + orientationRotateMatrix[5]
  document.getElementById('matrix6').innerHTML =
    'Matrix 6 elem ' + orientationRotateMatrix[6]
  document.getElementById('matrix7').innerHTML =
    'Matrix 7 elem ' + orientationRotateMatrix[7]
  document.getElementById('matrix8').innerHTML =
    'Matrix 8 elem ' + orientationRotateMatrix[8]
  document.getElementById('matrix9').innerHTML =
    'Matrix 9 elem ' + orientationRotateMatrix[9]
  document.getElementById('matrix10').innerHTML =
    'Matrix 10 elem ' + orientationRotateMatrix[10]
  document.getElementById('matrix11').innerHTML =
    'Matrix 11 elem ' + orientationRotateMatrix[11]
  document.getElementById('matrix12').innerHTML =
    'Matrix 12 elem ' + orientationRotateMatrix[12]
  document.getElementById('matrix13').innerHTML =
    'Matrix 13 elem ' + orientationRotateMatrix[13]
  document.getElementById('matrix14').innerHTML =
    'Matrix 14 elem ' + orientationRotateMatrix[14]
  document.getElementById('matrix15').innerHTML =
    'Matrix 151 elem ' + orientationRotateMatrix[15]

  // First pass for left eye, drawing red component only)

  gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, matAccum2)
  //let matrLeftFrustum = ApplyLeftFrustum(convrg, eyesep, asprat, fov, near, far)
  gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, projection)

  //gl.uniform4fv(shProgram.iColor, [1, 1, 0, 1])
  //gl.colorMask(true, false, false, false)
  gl.uniform4fv(shProgram.iColor, [1, 1, 0, 1])
  surface.Draw()
  //gl.clear(gl.DEPTH_BUFFER_BIT)

  // // Second pass for right eye, drawing blue+green component only

  // let matrRightFrustum = ApplyRightFrustum(
  //   convrg,
  //   eyesep,
  //   asprat,
  //   fov,
  //   near,
  //   far
  // )
  // //let translateRightEye = m4.translation(eyesep / 2, 0, 0)
  // // matAccum2 = m4.multiply(translateToPointZero, matAccum0)
  // // matAccum3 = m4.multiply(orientationRotateMatrix, matAccum2)
  // // projectionMatrix = m4.multiply(projection, matAccum3)

  // // // First pass for left eye, drawing red component only)

  // // gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, matAccum3)
  // // //let matrLeftFrustum = ApplyLeftFrustum(convrg, eyesep, asprat, fov, near, far)
  // // gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, projectionMatrix)

  // gl.colorMask(false, true, true, false)
  // surface.Draw()
  // gl.colorMask(true, true, true, true)
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

  //gl.enable(gl.DEPTH_TEST)
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
}

function ReadGyroscope() {
  let NS2S = 1.0 / 1000000000.0
  let sensor = new Gyroscope({ frequency: 5 })
  sensor.addEventListener('reading', (e) => {
    document.getElementById('velocity_x').innerHTML =
      'Angular velocity along the X-axis ' + sensor.x
    document.getElementById('velocity_y').innerHTML =
      'Angular velocity along the Y-axis ' + sensor.y
    document.getElementById('velocity_z').innerHTML =
      'Angular velocity along the Z-axis ' + sensor.z
    let current = e.timeStamp
    let dt = (current - timestamp) * NS2S
    let x = sensor.x
    let y = sensor.y
    let z = sensor.z

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

    let deltaRotVec = Array(3)
    deltaRotVec[0] = sinTheta * x
    deltaRotVec[1] = sinTheta * y
    deltaRotVec[2] = sinTheta * z
    deltaRotVec[3] = cosTheta

    let deltaRotationMatrix = Array(16)

    timestamp = current
    getRotationMatrixFromVector(deltaRotationMatrix, deltaRotVec)
    orientationRotateMatrix = m4.multiply(
      deltaRotationMatrix,
      orientationRotateMatrix
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
    console.log(R[0])
    console.log(1 - sq_q2 - sq_q3)
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
