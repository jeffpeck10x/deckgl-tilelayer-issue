/* global fetch, DOMParser */
import React, {useMemo, useState} from 'react';
import {render} from 'react-dom';

import {DeckGL} from "@deck.gl/react";
import {OrthographicView, COORDINATE_SYSTEM, CompositeLayer} from "@deck.gl/core";
import {TileLayer} from '@deck.gl/geo-layers';
import {IconLayer} from '@deck.gl/layers';

const INITIAL_VIEW_STATE = {
  target: [13000, 13000, 0],
  zoom: -7
};

const ICON_MAPPING = {
  marker: {x: 0, y: 0, width: 128, height: 128, mask: true},
};

const SAMPLE_DATA = Array.from({length: 500000}, (_, i) => ({
  index: i,
  position: [Math.random() * 24000, Math.random() * 24000],
}));

console.log(SAMPLE_DATA[4]);

async function getData(bbox, z) {
  // Stall for 20ms - simulate an async request
  await new Promise(resolve => setTimeout(resolve, 20));

  return SAMPLE_DATA.filter(
    d =>
      d.position[0] > bbox.left &&
      d.position[0] < bbox.right &&
      d.position[1] > bbox.top &&
      d.position[1] < bbox.bottom &&
      d.index % Math.max(1, Math.pow(z, 2)) === 0 // subsample
  );
}

class ExampleCompositeLayer extends CompositeLayer {
  constructor(props) {
    // By default, deckgl will attempt to _fetch_ any data of type string
    // Here, we want to accept data of type string, but simply pass that data along to
    // the TileLayer, so we explicitly turn off the _fetch_ capability here.
    props.fetch = undefined;

    super(props);
  }

  renderLayers() {
    return [new TileLayer({
      tileSize: this.props.dimensions.tileSize,
      highlightColor: [60, 60, 60, 100],
      minZoom: -7,
      maxZoom: 0,
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      // extent: [0, 0, dimensions.width, dimensions.height],
      getTileData: async ({z, bbox}) => {
        return await getData(bbox, z);
      },
      // onViewportLoad: this.props.onTilesLoad,
      renderSubLayers: props => {
        return new IconLayer(
          // This is where the issue is happening. If we remove `this.getSubLayerProps` the issue goes away
          this.getSubLayerProps({
            data: props.data,
            filled: true,
            getColor: () => [255, 255, 255],
            getIcon: () => "marker",
            iconAtlas:
              "https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png",
            iconMapping: ICON_MAPPING,
            id: `icon-layer-${props.id}`,
            sizeMinPixels: 10,
            updateTriggers: {},
          })
        );
      }
    })];
  }
}

export default function App({onTilesLoad}) {
  const dimensions = useMemo(() => ({
    height: 24000,
    tileSize: 512,
    width: 24000
  }));

  const [viewState, setViewState] =
    useState(INITIAL_VIEW_STATE);

  const tileLayer =
    dimensions &&
    new ExampleCompositeLayer({
      dimensions,
      id: "test",
      onTilesLoad
    });

  const onViewStateChange = ({viewState}) => {
    setViewState(viewState);
  };

  return (
    <DeckGL
      views={[new OrthographicView({controller: true, id: 'ortho'})]}
      layers={[tileLayer]}
      onViewStateChange={onViewStateChange}
      viewState={viewState}
    />
  );
}

export function renderToDOM(container) {
  render(<App/>, container);
}