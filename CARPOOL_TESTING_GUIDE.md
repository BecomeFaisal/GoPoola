# GoPoola Carpooling Feature - Testing Guide

## 🛠️ Setup Requirements

### Browser Setup
- **Need 3+ Browser Windows/Tabs:**
  1. Captain Browser (Chrome/Firefox) - Login as Captain
  2. User 1 Browser (Edge/Safari) - Login as User
  3. User 2 Browser (Incognito/Private) - Login as Another User

- **Important:** Each role must have SEPARATE localStorage to maintain distinct tokens
  - Use browser DevTools or Incognito mode for isolation

### Data Setup
- Ensure you have test accounts:
  - 1 Captain account (with vehicle)
  - 2+ User accounts (registered users)
- All accounts should be on same MongoDB (test database)

---

## 📝 Test Scenarios

### Scenario 1: Create First Carpool Ride

**Step 1.1: Captain Prepares**
1. Open Captain Browser
2. Go to /captain-home
3. Wait for ride notifications
4. Note: Captain location updates every 10 seconds via geolocation

**Step 1.2: User 1 Creates Carpool Ride**
1. Open User 1 Browser → Home page
2. Enter:
   - Pickup: "Pickup Location A"
   - Destination: "Destination X"
3. Click "Find Trip"
4. In Vehicle Panel, select "carCarpool" or "autoCarpool"
5. Click "Confirm Ride"
6. In Captain Browser → See "new-ride" notification with RidePopUp

**Step 1.3: Captain Accepts Ride**
1. In Captain Browser → User 1's ride appears in RidePopUp
2. Click "Confirm" button
3. RidePopUp closes, ConfirmRidePopUp appears
4. Verify: Shows User 1 details, correct fare
5. Enter OTP from backend terminal log (default: "123456")
6. Click "Confirm & Start"
7. Should redirect to CaptainRiding page

---

### Scenario 2: Second User Joins Same Route

**Step 2.1: User 2 Requests Same Route**
1. Open User 2 Browser → Home page
2. Enter SAME locations as User 1:
   - Pickup: "Pickup Location A"
   - Destination: "Destination X"
3. Click "Find Trip"
4. Select "carCarpool" or "autoCarpool" (MUST match User 1's choice)
5. Click "Confirm Ride"

**Expected Result in User 2 Browser:**
- Request should process
- Either shows "Carpool available" notification
- Or queued in backend

**Expected Result in Captain Browser:**
- New "carpool-request" notification appears at top-right (yellow box)
- Shows:
  - "New Passenger Request!"
  - Passenger: [User 2 Name]
  - Route: Pickup Location A → Destination X
  - Fare: [Divided Amount] (should be less than original)
  - Accept/Decline buttons

**Step 2.2: Captain Reviews ConfirmRidePopUp**
1. In ConfirmRidePopUp, scroll passenger list
2. Verify shows:
  - User 1: passed (status: "accepted")
  - User 2: pending (status: "pending", fare: reduced, Accept button visible)
3. **Important:** Fares should be recalculated:
  - Original: ₹100 (example)
  - User 1 now: ₹50 (100/2)
  - User 2 now: ₹50 (100/2)

**Step 2.3: Captain Accepts Carpool Request**
1. In ConfirmRidePopUp, click "Accept" button next to User 2
2. Should show success confirmation
3. User 2's status changes to "accepted"

---

### Scenario 3: Verify User Experience During Carpool

**Step 3.1: User 1 Waiting for Driver**
1. Open User 1 Browser (still waiting)
2. Scroll to "WaitingForDriver" component
3. Verify displays:
  - **Captain Details:** Full name, vehicle color, plate, vehicle type
  - **OTP:** Displayed (e.g., "ABC123")
  - **Fellow Passengers Section:**
    - User 2: name, email, ₹50 (divided fare)
    - Status: "accepted"
  - **Pickup & Destination:** Both shown
  - **Individual Fare:** ₹50 (not total)

**Step 3.2: User 2 Carpool Request Shows**
1. Open User 2 Browser
2. After few seconds, should see socket event confirmation
3. Check console → Look for "carpool-accepted" event

---

### Scenario 4: Ride Ongoing - Adding 3rd Passenger

**Step 4.1: Start Ride from Captain**
1. In Captain Browser ConfirmRidePopUp
2. Enter OTP: "123456"
3. Click "Confirm & Start"
4. Should navigate to CaptainRiding

**Step 4.2: User 3 Requests Carpool Mid-Ride**
1. Open User 3 Browser → Home
2. Enter SAME locations:
   - Pickup: "Pickup Location A"
   - Destination: "Destination X"
3. Request carpool
4. Captain Browser → New carpool-request appears
5. In ConfirmRidePopUp:
  - User 1: pending (odd behavior, should be "ongoing")
  - User 2: accepted
  - User 3: pending (new request)
  - Fares now: 100/3 = ₹33.33 each (rounded)

**Step 4.3: Captain Accepts User 3**
1. Click Accept button for User 3
2. User 3 should see socket notification

---

### Scenario 5: Ride Completion

**Step 5.1: Captain Ends Ride**
1. In Captain Browser CaptainRiding
2. Look for "End Ride" button
3. Rides endpoint: `POST /rides/end-ride`

**Step 5.2: Users See Completion**
1. Both User 1 and User 2 navigate to Riding page if not already there
2. Should see notification: "ride-ended" via socket
3. Auto-redirect to /home

---

## 🔍 Verification Checklist

### Backend Verification
```bash
# 1. Check MongoDB documents
# In MongoDB, verify ride has multiple passengers:
db.rides.findOne({ _id: ObjectId("...") })
# Should show: passengers: [
#   { user: ObjectId(...), fare: 50, status: "accepted" },
#   { user: ObjectId(...), fare: 50, status: "accepted" },
#   { user: ObjectId(...), fare: 50, status: "pending" }
# ]

# 2. Check logs for carpool detection
# Server logs should show:
# "Is carpool: true"
# "Looking for existing carpool ride..."
# "Existing ride found: ObjectId(...)"
# "Adding passenger to existing ride"
```

### Frontend Verification
```javascript
// In Browser Console (user rides):
localStorage.getItem('ride')
// Should show passengers array with multiple items

// In Browser Console (captain):
localStorage.getItem('captainToken')
// Should be different from localStorage.getItem('token')

// Check socket events:
// User should receive 'carpool-accepted' when joining
// Captain should receive 'carpool-request' when user joins
```

### localStorage Isolation Check
```javascript
// Captain Browser:
localStorage.getItem('captainToken') // Should exist
localStorage.getItem('token') // Should NOT exist or be empty

// User Browser:
localStorage.getItem('token') // Should exist
localStorage.getItem('captainToken') // Should NOT exist or be empty
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: Captain Not Seeing Carpool Request
**Solution:**
1. Verify captain browser has captainToken (not token)
2. Check console for "socket connected" message
3. Ensure users are selecting SAME carpool vehicle type
4. Confirm ride status is "accepted" or "ongoing"

### Issue 2: Fares Not Dividing Correctly
**Solution:**
1. Check backend console for "Recalculating fares" message
2. Verify ride has multiple passengers in MongoDB
3. Clear browser cache and refresh

### Issue 3: User Can't Request Same Route
**Solution:**
1. Ensure first ride status is "accepted" or "ongoing" (not "pending")
2. Check vehicleType matches exactly (case-sensitive)
3. Verify pickup/destination strings match precisely

### Issue 4: Carpool Request Notification Not Appearing
**Solution:**
1. Check Socket.io connection: `socket.connected` in console
2. Verify captain is joined to socket: `socket.emit('join')`
3. Check backend `sendMessageToSocketId()` function is receiving correct socketId
4. Verify captain's socketId matches in socket event

---

## 📊 Expected Behavior Summary

| Feature | Expected Outcome |
|---------|-----------------|
| **First User Carpool** | Ride created, captain notified |
| **Second User Same Route** | Added to existing ride, fares divided by 2 |
| **Third User Same Route** | Added to existing ride, fares divided by 3 |
| **Captain Accepts Passenger** | Passenger status: "pending" → "accepted" |
| **Passenger Visible to Others** | All passengers see each other in waiting/riding screens |
| **Fare Display** | Each passenger sees their individual share |
| **Carpool Badge** | "🚗 Carpool Ride - 3 Passengers" shown to captain |
| **Non-Carpool Vehicles** | Regular rides work as before (no carpool detection) |
| **Ride Without Carpool** | Auto/car vehicle types create new rides (no sharing) |

---

## 🐛 Debug Commands

### Check Active Connections
```bash
# Terminal: Check how many captains/users are connected
# Look for socket logs: "Captain joined" "User joined"
```

### Monitor Fare Calculations
```bash
# Terminal: Watch for logs like:
# "Recalculating fares: total passengers 2, fare per passenger 50"
```

### Verify Route Matching
```bash
# Check if routes match (case-sensitive):
# Server log: "Looking for existing carpool ride..."
# If empty array: Routes don't match or ride not in correct status
```

---

## ✅ Success Criteria

- [ ] User 1 creates carpool ride, captain sees it
- [ ] User 2 joins same route, fares divide by 2
- [ ] Captain accepts carpool request smoothly
- [ ] ConfirmRidePopUp shows all passengers
- [ ] WaitingForDriver shows fellow passengers
- [ ] Fares displayed correctly (100/2 = 50 each)
- [ ] User 3 can join mid-ride if needed
- [ ] All passengers shown in captain's riding screen
- [ ] Ride ends for all participants
- [ ] Token isolation works (separate browsers)

---

## 🎬 Quick Test Script (5 minutes)

1. **Captain Opens:** http://localhost:5173/captain-home
2. **User1 Opens:** http://localhost:5173/home (Other browser)
3. **User1 Enters:** Pickup="A St", Destination="B Ave", Vehicle="carCarpool"
4. **Captain Sees:** new-ride popup, clicks Confirm
5. **User2 Opens:** http://localhost:5173/home (Incognito)
6. **User2 Enters:** Pickup="A St", Destination="B Ave", Vehicle="carCarpool"
7. **Captain Sees:** carpool-request notification
8. **Captain Clicks:** Accept button
9. **Captain Verifies:** ConfirmRidePopUp shows 2 passengers, fares are halved
10. **Done!** ✅

