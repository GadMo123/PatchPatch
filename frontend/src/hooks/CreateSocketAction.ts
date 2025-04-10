import {
  SocketEvents,
  LoginPayload,
  LoginResponse,
  InGamePayload,
  PlayerActionPayload,
  CardArrangementPayload,
  JoinGamePayload,
  BuyIntoGamePayload,
  LobbyStatusServerResponse,
  HandlerResponse,
  SocketEventType,
  SitOutPayload,
} from "@patchpatch/shared";
import socket from "../services/socket/Socket";
import { Socket } from "socket.io-client";

function createSocketAction<TPayload = void, TResponse = HandlerResponse>(
  socket: Socket,
  event: SocketEventType
) {
  return () => {
    const sendAction = (payload: TPayload) => {
      return new Promise<TResponse>((resolve) => {
        if (payload === undefined) {
          // If no payload, only send event and callback
          socket.emit(event, (response: TResponse) => {
            resolve(response);
          });
        } else {
          socket.emit(event, payload, (response: TResponse) => {
            resolve(response);
          });
        }
      });
    };

    return { sendAction };
  };
}

// Login
export const useLogin = createSocketAction<LoginPayload, LoginResponse>(
  socket,
  SocketEvents.LOGIN
);

// Enter game (as observer)
export const useEnterGame = createSocketAction<InGamePayload>(
  socket,
  SocketEvents.ENTER_GAME
);

// Join game (as player)
export const useJoinGame = createSocketAction<JoinGamePayload>(
  socket,
  SocketEvents.JOIN_GAME
);

// Buy into game
export const useGameBuyIn = createSocketAction<BuyIntoGamePayload>(
  socket,
  SocketEvents.GAME_BUYIN
);

// Player betting actions
export const usePlayerAction = createSocketAction<PlayerActionPayload>(
  socket,
  SocketEvents.PLAYER_ACTION
);

// Arrange cards
export const useCardsArrangement = createSocketAction<CardArrangementPayload>(
  socket,
  SocketEvents.CARDS_ARRANGEMENT
);

// Get lobby status
export const useLobbyStatus = createSocketAction<
  void,
  LobbyStatusServerResponse
>(socket, SocketEvents.LOBBY_STATUS);

// Use timebank
export const useTimebank = createSocketAction<InGamePayload>(
  socket,
  SocketEvents.USE_TIMEBANK
);

// Sit out next hand
export const useSitOutNextHand = createSocketAction<SitOutPayload>(
  socket,
  SocketEvents.SIT_OUT_NEXT_HAND
);

// Stand up from table
export const useStandUp = createSocketAction<InGamePayload>(
  socket,
  SocketEvents.STAND_UP
);

// Ask for game state update (in case of DC or missed braodcast)
export const useGameStateRequest = createSocketAction<InGamePayload>(
  socket,
  SocketEvents.GAME_STATE_UPDATE
);

// Exit game
export const useExitGame = createSocketAction<InGamePayload>(
  socket,
  SocketEvents.EXIT_GAME
);
