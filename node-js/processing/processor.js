const uuid = require('node-uuid');
const text_helper = require('./text_helper')
const Slides = require('./slides');

let data = {
  slides: [],
  wsFrontend: Object,
  current_slide: 0,
  current_note_order: 0,
  changesToPush: false,
  finished: false
};

const onNewTranscribedText = function(text){
  //text.raw_text
  //text.clean_text
  matchBuzzwordsAgainst(text)
};

const loadConfig = function(){
  data.slides = require('./sample_data');

  //add property remaining: Object and completed: Number (0...1) to every note
  data.slides =  data.slides.map((item, index, array) => {
    item.notes = item.notes.map((item, index, array) => {
      let temp = item;
      temp.id = uuid.v1();
      temp.completed = false;
      temp.remaining = item.data.map(text_helper.toLowerCase);
      return temp;
    });
    return item;
  });

};

const matchBuzzwordsAgainst = function(text){


    let words = text_helper.splitTextToList(text)

    let current_notes = [];
    let startIndex, endIndex = data.slides[data.current_slide].notes.length;
    data.slides[data.current_slide].notes.forEach((note, index) => {
        if (note.order === data.current_note_order){
            startIndex = index;
        }else if (startIndex > -1 && note.order !== data.current_note_order){
            endIndex = index;
        }
    })
    //console.log("start to end", startIndex, endIndex)
    for (let i = startIndex; i<endIndex;i++){
        let note  = data.slides[data.current_slide].notes[i];

        note.remaining = note.remaining.filter((word, index, array) => {
            //console.log(text, word)
            if (text.toLowerCase().includes(word.toLowerCase())){
                //console.log("found", index)
                data.changesToPush = true;
                return false;
            }else{
                return true;
            }
        })
        //console.log("remaining", note.remaining)
        deleteIfEmpty(data.slides[data.current_slide].notes[i], i, data.slides[data.current_slide].notes);
    }

    if(data.changesToPush){
        sendToFrontend('update', {"slide": data.current_slide, "finished": data.finished, "slides": data.slides})
        data.changesToPush = false;
    }
};


const deleteIfEmpty = function(note, index, array){
    if (note.remaining.length === 0){
        note.completed = true;
        data.changesToPush = true;
        data.current_note_order++;
        //console.log("delete since it is empty", data.current_note_order)
        checkForSlideChange(note)
    }

}

const checkForSlideChange = function(note){
    if (note.postactions.includes('triggerAnimation')){
            Slides.sendCommand('next');

    }
    if (note.postactions.includes('nextSlide')){
        if (data.current_slide < data.slides.length-1){
            data.current_slide++;
            Slides.sendCommand('next');
            data.current_note_order = 0;
        }else{
            data.finished = true
        }
    }
}



const sendToFrontend = function(type, _data){
  if (data.wsFrontend === undefined){
    console.error('no frontend connected');
  }else{
    data.wsFrontend.emit(type, _data
    );
  }
};

const  sendInitToFrontend =function(){
    sendToFrontend('update', {"slide": data.current_slide, "finished": data.finished, "slides": data.slides})
};

// Establish a channel to directly control slides.
const initSlideControl = function() {
  data.wsFrontend.on('slide-command', cmd => Slides.sendCommand(cmd));
};


const onInit = function(){
  loadConfig();
};

const onSlideChange = (slide) => {
  data.wsFrontend.emit('slide-change', {slide});

};

const onFrontendConnected = function(ws){
  data.wsFrontend  = ws;
  sendInitToFrontend();
  initSlideControl();
};




module.exports = {
  onInit,
  onFrontendConnected,
  sendInitToFrontend,
  onNewTranscribedText,
  onSlideChange
};
