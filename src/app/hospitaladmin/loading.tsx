export default function HospitalAdminLoading() {
  return (
    <div className="hd-body" style={{ gridTemplateColumns: "1fr" }}>
      <div className="hd-center">
        <div className="hd-page-loader">
          <span className="hd-spin-block" />
          Loading...
        </div>
        <div className="hd-stats">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="hd-sc" style={{ background: "#fff" }}>
              <span className="hd-skel" style={{ width: 40, height: 40, borderRadius: 12 }} />
              <div style={{ flex: 1 }}>
                <span className="hd-skel" style={{ width: 88, height: 10, marginBottom: 8 }} />
                <div>
                  <span className="hd-skel" style={{ width: 52, height: 18 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
