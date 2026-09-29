# ============================================================
# NS-2 One Sender - Three Receivers Simulation
# ============================================================

# Create simulator
set ns [new Simulator]

# ------------------------------------------------------------
# NAM configuration
# ------------------------------------------------------------

set namfile [open send_receive.nam w]
$ns namtrace-all $namfile

# Define flow colors
$ns color 1 Blue
$ns color 2 Red
$ns color 3 Green

# ------------------------------------------------------------
# Create nodes
# ------------------------------------------------------------

set sender    [$ns node]
set receiver1 [$ns node]
set receiver2 [$ns node]
set receiver3 [$ns node]

# ------------------------------------------------------------
# Node colors
# ------------------------------------------------------------

$sender color Blue

$receiver1 color Red
$receiver2 color Green
$receiver3 color Orange

# ------------------------------------------------------------
# Node labels
# ------------------------------------------------------------

$sender label "SENDER"

$receiver1 label "RECEIVER 1"
$receiver2 label "RECEIVER 2"
$receiver3 label "RECEIVER 3"

# ------------------------------------------------------------
# Create links
# ------------------------------------------------------------

$ns duplex-link $sender $receiver1 10Mb 10ms DropTail
$ns duplex-link $sender $receiver2 10Mb 10ms DropTail
$ns duplex-link $sender $receiver3 10Mb 10ms DropTail

# ------------------------------------------------------------
# Position links
# ------------------------------------------------------------

$ns duplex-link-op $sender $receiver1 orient right-up
$ns duplex-link-op $sender $receiver2 orient right
$ns duplex-link-op $sender $receiver3 orient right-down

# Queue positions
$ns duplex-link-op $sender $receiver1 queuePos 0.5
$ns duplex-link-op $sender $receiver2 queuePos 0.5
$ns duplex-link-op $sender $receiver3 queuePos 0.5

# ------------------------------------------------------------
# UDP Sender 1 -> Receiver 1
# ------------------------------------------------------------

set udp1 [new Agent/UDP]
$udp1 set fid_ 1

$ns attach-agent $sender $udp1

set null1 [new Agent/Null]
$ns attach-agent $receiver1 $null1

$ns connect $udp1 $null1

# CBR Traffic 1
set cbr1 [new Application/Traffic/CBR]

$cbr1 set packetSize_ 512
$cbr1 set interval_ 0.02
$cbr1 set random_ false

$cbr1 attach-agent $udp1

# ------------------------------------------------------------
# UDP Sender 2 -> Receiver 2
# ------------------------------------------------------------

set udp2 [new Agent/UDP]
$udp2 set fid_ 2

$ns attach-agent $sender $udp2

set null2 [new Agent/Null]
$ns attach-agent $receiver2 $null2

$ns connect $udp2 $null2

# CBR Traffic 2
set cbr2 [new Application/Traffic/CBR]

$cbr2 set packetSize_ 512
$cbr2 set interval_ 0.02
$cbr2 set random_ false

$cbr2 attach-agent $udp2

# ------------------------------------------------------------
# UDP Sender 3 -> Receiver 3
# ------------------------------------------------------------

set udp3 [new Agent/UDP]
$udp3 set fid_ 3

$ns attach-agent $sender $udp3

set null3 [new Agent/Null]
$ns attach-agent $receiver3 $null3

$ns connect $udp3 $null3

# CBR Traffic 3
set cbr3 [new Application/Traffic/CBR]

$cbr3 set packetSize_ 512
$cbr3 set interval_ 0.02
$cbr3 set random_ false

$cbr3 attach-agent $udp3

# ------------------------------------------------------------
# Simulation schedule
# ------------------------------------------------------------

# Start all traffic
$ns at 0 "$cbr1 start"
$ns at 0 "$cbr2 start"
$ns at 0 "$cbr3 start"

# Stop all traffic
$ns at 9.5 "$cbr1 stop"
$ns at 9.5 "$cbr2 stop"
$ns at 9.5 "$cbr3 stop"

# ------------------------------------------------------------
# Finish procedure
# ------------------------------------------------------------

proc finish {} {
    global ns namfile

    $ns flush-trace
    close $namfile

    # Automatically open NAM
    exec nam send_receive.nam &

    exit 0
}

# ------------------------------------------------------------
# Finish simulation
# ------------------------------------------------------------

$ns at 10.0 "finish"

# ------------------------------------------------------------
# Start simulation
# ------------------------------------------------------------

$ns run
