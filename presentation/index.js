// Import React
import React from "react";

// Import Spectacle Core tags
import {
  BlockQuote,
  Cite,
  Deck,
  Heading,
  ListItem,
  List,
  Quote,
  Slide,
  Text
} from "spectacle";

// Import image preloader util
import preloader from "spectacle/lib/utils/preloader";
import * as convert from "./convertFromNm"

// Import theme
import createTheme from "spectacle/lib/themes/default";
// import createTheme from 'spectacle-theme-nova';
// import { theme } from "spectacle-theme-solarized-dark";

// Require CSS
require("normalize.css");
require("spectacle/lib/themes/default/index.css");


const images = {
  // city: require("../assets/city.jpg"),
};

preloader(images);

const theme = createTheme({
  primary: "#656565",
  secondary: "rgb(255, 142, 38)",
  tertiary: "#00539e",
  quartenary: "#CECECE"
}, {
  primary: "Montserrat",
  secondary: "Helvetica"
});
theme.screen.components.quote.fontSize = '3.5rem'
theme.screen.components.quote.fontWeight = '400'
theme.screen.components.quote.lineHeight = '1.3'
theme.screen.global.body.backgroundColor = 'white'

export default class Presentation extends React.Component {
  render() {
    const nodes = []
    convert.collectSlideNodes(require('../talk.nm.json'), [], nodes)
    const slides = nodes.map(convert.nodeToSlide)
    console.log('slides', slides)
    return (
      <Deck transition={["fade"]} transitionDuration={300} progress="number" theme={theme}>
        {slides}

        {/* <Slide bgColor="primary" notes={`Hello I'm a note and I have lots to say to you
Here's some space.
<br/>
<br/>
And more space I guess
<br/>
<b>
Ah this is innerHTML huh
</b>

`}>
          <Heading size={1} fit caps lineHeight={1} textColor="secondary">
            Spectacle Boilerplate
          </Heading>
          <Text margin="10px 0 0" textColor="tertiary" size={1} fit bold>
            open the presentation/index.js file to get started
          </Text>
        </Slide>
        <Slide bgColor="tertiary">
          <Heading size={6} textColor="primary" caps>Typography</Heading>
          <Heading size={1} textColor="secondary">Heading 1</Heading>
          <Heading size={2} textColor="tertiary">Heading 2</Heading>
          <Heading size={3} textColor="secondary">Heading 3</Heading>
          <Heading size={4} textColor="secondary">Heading 4</Heading>
          <Heading size={5} textColor="secondary">Heading 5</Heading>
          <Text size={6} textColor="secondary">Standard text</Text>
        </Slide>
        <Slide bgColor="primary" textColor="tertiary">
          <Heading size={6} textColor="secondary" caps>Standard List</Heading>
          <List>
            <ListItem>Item 1</ListItem>
            <ListItem>Item 2</ListItem>
            <ListItem>Item 3</ListItem>
            <ListItem>Item 4</ListItem>
          </List>
        </Slide>
        <Slide bgColor="secondary" textColor="primary">
          <BlockQuote>
            <Quote>Example Quote</Quote>
            <Cite>Author</Cite>
          </BlockQuote>
        </Slide> */}
      </Deck>
    );
  }
}
