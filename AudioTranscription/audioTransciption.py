#!/usr/bin/env python2
'''
This python 2 script will transcribe the audio of one audio source with the help ob Bings Speech to Text API.
This is a multi threaded python script, so it might be hard to kill!!!
'''
import asyncore
import io
import json
import sys
import threading
import time

import requests
import speech_recognition as sr

'''
Array of Bing Voice Recognition API keys (32-character lowercase hexadecimal strings)
Reccomended amount of keys min 4/DELTA keys
'''
BING_KEY = ["INSERT API KEY HERE"]

'''
The following parameters describe the configuration of your sliding windows.
DELTA: Minimal distance between each window in seconds
NUMBER_OF_THREADS: Number of sliding windows
WAIT_CYCLE: Time to wait until each windows recording is restarted (WAIT_CYCLE*DELTA = Time to wait). This should be bigger then the response time of bing.
            Max(responseTime, DELTA*WAIT_CYCLE) is actually used

=> The resulting length of each sliding window is at least (NUMBER_OF_THREADS - WAIT_CYCLE) * DELTA
'''
DELTA = 3
NUMBER_OF_THREADS = 7
WAIT_CYCLE = 2

'''
Audio device index as defined in PyAudio
'''
AUDIO_DEVICE_INDEX = 0

'''
The IP adress of the node.js server, that exposes the API.
If you use two computers ngrok might be your rescue.
'''
IP = "http://localhost:3000/speech"

# API Header
HEADER = {'Content-Type': 'application/json'}

'''
This method tries to the Bing API with a given audio frame and sends the resulting transcription to the node.js server.
@param audio    Audio frame of multiple chunks
@param r        Audio recognizer
@param i       The unique number of the sliding window is used to select the proper api key.
'''


def callBingApi(r, audio, i):
    try:
        msg = r.recognize_bing(
            audio, key=BING_KEY[i % len(BING_KEY)])
        print(msg)
        sendToServer(msg)
    except sr.UnknownValueError:
        print(
            "Microsoft Bing Voice Recognition could not understand audio")
    except sr.RequestError as e:
        print(
            "Could not request results from Microsoft Bing Voice Recognition service; {0}".format(e))


'''
This method builds a dictionary of threading events, that is used to coordinate the diffrent sliding windows.
It will build start, stop and done threading events for each thread.
'''


def buildEventDict():
    # Build event dictionary
    eStart = threading.Event()
    eStop = threading.Event()
    eDone = threading.Event()
    eventDict = {
        'start': eStart,
        'stop': eStop,
        'done': eDone
    }
    return eventDict


'''
This method will send a string to the node.js backend.
It uses the exposed API of the server to transmit a JSON object with the following structure:
{
    'text': string
}
@param msg  The string that should be transmited to the server
'''


def sendToServer(msg):
    try:
        r = requests.post(IP, data=json.dumps({'text': msg}), headers=HEADER)
    except e:
        print("Request Failed " + str(e))


'''
This function records the audio for one sliding window of an audio source until the stopEvent is set.
@param source       Audio source that should be recorded
@param stopEvent    The threading event that should stop recording
@return             The audio frame containing the recorded audio
'''


def recordWindow(source, stopEvent):
    assert source.stream is not None, "Audio source must be entered before recording, see documentation for ``AudioSource``; are you using ``source`` outside of a ``with`` statement?"

    frames = io.BytesIO()
    while not stopEvent.is_set():
        buffer = source.stream.read(source.CHUNK)
        frames.write(buffer)

    frame_data = frames.getvalue()
    frames.close()
    myTime = str(time.time())
    return sr.AudioData(frame_data, source.SAMPLE_RATE, source.SAMPLE_WIDTH)


'''
This function describes one sliding window and can be used as thread.
It will listen to threading events and set them according to its state, to make the sliding windows work.
@param eList
@param countingVar
@param recognizer
@param sourceMic
'''


def slidingWindowThread(eList, countingVar, recognizer, sourceMic):
    # Audio main thread rec and asks with events
    # obtain audio from the microphone
    myTime = str(time.time())
    while True:
        eList['start'].wait()
        eList['start'].clear()
        myTime = str(time.time())
        startTime = time.time()
        with sourceMic as source:
            audio = recordWindow(source, eList['stop'])
            eList['stop'].clear()
            requestTime = time.time()
            callBingApi(recognizer, audio, countingVar)
            stopTime = time.time()
        eList['done'].set()
        print(str(countingVar) + "<---->" + str(requestTime - startTime) +
              " , " + str(stopTime - requestTime))
        myTime = str(time.time())
        countingVar += NUMBER_OF_THREADS


'''
Main of the audio transcription script
'''
if __name__ == '__main__':
    eList = []
    countingVarList = []
    rList = []
    sourceList = []
    threadList = []

    for i in range(0, NUMBER_OF_THREADS):
        eList.append(buildEventDict())
        countingVarList.append(i)
        rList.append(sr.Recognizer())
        sourceList.append(sr.Microphone(
            device_index=AUDIO_DEVICE_INDEX, sample_rate=48000))

    for i in range(0, NUMBER_OF_THREADS):
        threadList.append(threading.Thread(name=str(i) + '-SlidingWindowThread',
                                           target=slidingWindowThread,
                                           args=(eList[i], countingVarList[i], rList[i], sourceList[i])))
        threadList[i].start()

    # Initial start of all Threads
    for i in range(0, NUMBER_OF_THREADS - WAIT_CYCLE):
        eList[i]['start'].set()
    for i in range(NUMBER_OF_THREADS - WAIT_CYCLE, NUMBER_OF_THREADS):
        eList[i]['done'].set()

    while True:
        # Only A recording
        for i in range(0, NUMBER_OF_THREADS):
            # Simultan recording of delta
            time.sleep(DELTA)
            # Kill i-th recording
            eList[i]['stop'].set()
            # Start i - k recording
            eList[(i - WAIT_CYCLE) % NUMBER_OF_THREADS]['done'].wait()
            eList[(i - WAIT_CYCLE) % NUMBER_OF_THREADS]['done'].clear()
            eList[(i - WAIT_CYCLE) % NUMBER_OF_THREADS]['start'].set()
