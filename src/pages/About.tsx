export default function About() {
  return (
    <section className="about">
      <p className="kicker">Colophon</p>
      <h1>About Katutubo</h1>
      <div className="prose">
        <p>
          <em>Katutubo</em> means "native" or "indigenous". This e-magazine introduces some of the Indigenous Peoples of the Philippines
          through their stories, music, beliefs and crafts, so that more Filipinos can know and value them.
        </p>
        <h2>A note on respect</h2>
        <p>
          Each culture here belongs to living communities. We use the names the communities use for themselves. We try not to treat
          sacred objects or rituals as decoration. Every article lists its sources. If you belong to one of these communities and see
          an error, we want to hear from you.
        </p>
        <h2>How it is made</h2>
        <p>
          A static website, with no database and no tracking. The 3D scenes are made with Three.js. The objects are simple stand-ins
          that will be replaced by models built from reference images. Any sound labelled <em>synthesized</em> is generated in your
          browser. It illustrates the instrument and is not a traditional recording.
        </p>
      </div>
    </section>
  )
}
