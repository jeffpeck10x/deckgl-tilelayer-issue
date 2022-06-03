/* global fetch, DOMParser */
import React, {useMemo} from 'react';
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

const SAMPLE_DATA = Array.from({length: 15000000}, (_, i) => ({
  index: i,
  position: [Math.random() * 24000, Math.random() * 24000],
}));

console.log(SAMPLE_DATA[4]);

async function getData(bbox, z) {
  // Stall for 200ms - simulate an async request
  await new Promise(resolve => setTimeout(resolve, 200));

  // Return a subsampled set of points within the bounding box
  return SAMPLE_DATA.filter(
    d =>
      d.position[0] > bbox.left &&
      d.position[0] < bbox.right &&
      d.position[1] > bbox.top &&
      d.position[1] < bbox.bottom &&
      d.index % Math.max(1, Math.pow(z, 2) * 100) === 0 // subsample
  );
}

class ExampleCompositeLayer extends CompositeLayer {
  renderLayers() {
    return [new TileLayer({
      tileSize: this.props.dimensions.tileSize,
      highlightColor: [60, 60, 60, 100],
      minZoom: -7,
      maxZoom: 0,
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      // extent: [0, 0, dimensions.width, dimensions.height],
      getTileData: ({z, bbox}) => {
        return getData(bbox, z);
      },
      onViewportLoad: this.props.onTilesLoad,
      renderSubLayers: props => {
        // console.log("renderSublayers", props.data[0].position);
        return new IconLayer({
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
          }
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

  const tileLayer =
    dimensions &&
    new ExampleCompositeLayer({
      dimensions,
      id: "test",
      onTilesLoad
    });

  return (
    <DeckGL
      views={[new OrthographicView({id: 'ortho'})]}
      layers={[tileLayer]}
      initialViewState={INITIAL_VIEW_STATE}
      controller={true}
    />
  );
}

export function renderToDOM(container) {
  render(<App/>, container);
}