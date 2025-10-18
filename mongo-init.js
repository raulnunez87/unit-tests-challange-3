// Initialize MongoDB replica set
try {
  const config = {
    _id: "rs0",
    members: [
      {
        _id: 0,
        host: "localhost:27017"
      }
    ]
  };
  
  rs.initiate(config);
  print("Replica set initialization started...");
  
  // Wait for replica set to be ready
  let retries = 30;
  while (retries > 0) {
    try {
      const status = rs.status();
      if (status.ok === 1) {
        print("Replica set is ready!");
        break;
      }
    } catch (e) {
      print("Waiting for replica set to be ready...");
      sleep(2000);
      retries--;
    }
  }
  
  if (retries === 0) {
    print("Replica set initialization timed out");
  }
} catch (e) {
  print("Error initializing replica set: " + e);
}