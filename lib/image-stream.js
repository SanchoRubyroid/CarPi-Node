var method = ImageStream.prototype;

function ImageStream(verbose) {
  this._verbose = verbose
  this._remaining_length = 0

  this.reset()
}

method.reset = function() {
  this._image_buffer = new Buffer(0)
  this._image_completed = false
}

method.compose = function(data_chunk) {
  this.say("NEW CHUNK: " + data_chunk.length)

  if(this._remaining_length == 0) {
    this._remaining_length = data_chunk.readUInt32LE(0)
    data_chunk = data_chunk.slice(4)
    this.say("-- IMAGE LEN: " + this.remaining_length)
  }

  if(data_chunk.length > 0) {
    this._image_buffer = Buffer.concat([this._image_buffer, data_chunk], this._image_buffer.length + data_chunk.length)
    this._remaining_length -= data_chunk.length

    this.say("CHUNK BUFF: " + data_chunk.length + ' LEN REMAINING: ' + this.remaining_length)

    if(this._remaining_length == 0) {
      this.say('IMAGE RECEIVED!')
      this._image_completed = true
    }
  }

  return this._age;
};

method.imageLength = function() {
  this._image_buffer.length
}

method.isImageReceived = function() {
  return this._image_completed
}

method.imageBase64 = function() {
  return this._image_buffer.toString('base64')
}

method.cleanUp = function() {
  this._image_buffer = null
}

method.say = function(message) {
  if(this._verbose) console.log(message)
}

module.exports = ImageStream;
