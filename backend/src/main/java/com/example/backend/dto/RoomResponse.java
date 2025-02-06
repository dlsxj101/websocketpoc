package com.example.backend.dto;

import com.example.backend.entity.Player;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class RoomResponse {
    // 클라이언트에게 전송할 방 상태 정보
    private String roomId;
    private List<Player> players;
    private String message;  // 예: "ROOM_CREATED", "GAME_STARTED", "PRESS_UPDATED" 등
}