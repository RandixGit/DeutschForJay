# Vision
A fun and engaging learning experience for my 9 year old son to learn German quickly. There should be a clear engagement loop to keep him interested, for example by injecting funny memes or cool facts as rewards, or by keeping tally of 'XP' that unlocks exciting things.
coupons for pocket money that either parent can approve/set to consumed on their phone or on the local device in the experiencey.

## Main Requirements
I want to build a learning experience/game that enables a fast and fun way for my 9 year old son to learn German from scratch. The experience is divided into modules, chapters, lessons and learning tasks.  My partner and I speak German and can be included in the gamified experience ('ask you mom about whats for dinner in German and ask her how to spell apple in German' - go back to this experience and confirm you did the exercise by typing in 'Apfel')

The experience can be hosted on a synology's built-in web server (DS224+).

The curriculum is that of any modern language learning approach and the learning content is well thought out and tagets a 9 year old. The experience starts easy and gradually expends on the players vocabulary and grammar skills. The curriculum could be pre-generated in it's entirety via a science model and provided in a specific format theat the experience can read and use to display the learning content and the interactive exercises. It's required for the curriculum file(s) to be versioned in git as well. The secondary requirement is to have an editor for the learning content, but for now let's just that it's easy for an editor to work with the data later on.

The learning experience allows for any German words, sentences or paragraphs in the experience to be read back to the player using TTS. For tts use the free kokoro tech if it supports both, english and german.

The experience should be fun and engaging with clear reward moments that keep my son engaged. There are various tyes of learning exercises, such as 
* vocabulary exercises/memorization/flash cards
* multiple choice with and without images
* drag and drop
* mini-games (platformer, clash royale inspired mini-game)
* fill in missing letters
* pronounce a german word or sentence
* dialog (exercise starts in english 'You want to ask: Can I please have a pack of Gummi-bears.', then   then player is asked to speak along in German and the dialog continues)
* to-do list (collect answers by asking German speakers for the German spelling of a given word or saying and add it to the list in the learning tool to receive points)
* listen and comprehend + confirm

Chapters or lessons in which the player struggled should be marked and offered up as review material in subsequent sessions.


In this gamified learning experience, there should be a clear progression with levels to unlock that supports the positive struggle-learning-positive feedback/encouragement loop. Sometimes collections of 3 pieces that fit together are needed to unlock something.


Use free apis as much as you can to keep the experience interesting and engaging, for example get help from free inferenceAI apis, find interesting topics, get fun meme images into the experience, fetch cool facts form knowledge/science APIs.

Segment the experience in clear learning modules starting simple with the goal of the player being able to speak German to a degree they could live with a German-speaking family and to a degree where they can enjoy watching movies in German.
* have basic conversations in German using basic vocabulary
* can have more complex conversations in German with a significantly expanded vocabulary
* comprehends commnications)
* can read kids books in German
* Math/counting in German

## Theme
As inspiration for theming the exercises: My son likes Roblox, Clash Royale, One Piece and absolutely loves soccer


## Advanced features
* Use STT to validate German input. Can kokoro do this as well?
* * a way to extend the learning content; an editor that allows to add learning content accross all exercise types
