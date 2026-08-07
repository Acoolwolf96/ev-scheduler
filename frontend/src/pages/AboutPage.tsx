function AboutPage() {
  return (
    <>
      <div className="eyebrow">About</div>
      <h1 className="title">Smart EV Charging</h1>
      <p className="subtitle">
        Charge your EV at the cheapest time, automatically.
      </p>

      <div className="about-card">
        <h2 className="about-heading">What is Smart EV Charging</h2>
        <p className="about-text">
          It's a tool that decides the best time to charge your car for you.
          Instead of plugging in and charging right away, whatever the price
          happens to be, it looks at how electricity prices are changing
          through the day and picks the cheapest window that still gets your
          car ready in time.
        </p>
      </div>

      <div className="about-card">
        <h2 className="about-heading">How it works</h2>
        <p className="about-text">
          You tell it three things: how much charge your battery has now,
          how much you want, and when you're leaving. It works out how long
          your car actually needs to charge, including a bit of extra time
          in cold weather since charging is slower in the cold. Then it finds
          the cheapest run of hours before your departure time and gives you
          a plan: start now or later, finish by a certain time, and how much
          you'll save compared to charging right away.
        </p>
      </div>

      <div className="about-card">
        <h2 className="about-heading">Why you should use it</h2>
        <p className="about-text">
          Electricity prices can swing a lot in a single day, sometimes
          several times over. Charging at the wrong hour can cost noticeably
          more than charging just a few hours later or earlier. Most people
          don't check prices before plugging in, so they pay whatever the
          price happens to be at that moment.
        </p>
        <p className="about-text">
          This isn't a made-up problem. Services already exist in Finland
          that charge people money specifically to do this kind of price
          timing for them. This does the same thing, for free, and keeps a
          record of what you've saved over time, so you can see the actual
          impact week to week or month to month.
        </p>
      </div>
    </>
  );
}

export default AboutPage;
