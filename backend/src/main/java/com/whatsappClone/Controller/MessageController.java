package com.whatsappClone.Controller;

import java.util.List;
import java.io.File;
import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.whatsappClone.Exception.ChatException;
import com.whatsappClone.Exception.MessageException;
import com.whatsappClone.Exception.UserException;
import com.whatsappClone.Model.Message;
import com.whatsappClone.Model.User;
import com.whatsappClone.Payload.ApiResponse;
import com.whatsappClone.Payload.SendMessageRequest;
import com.whatsappClone.ServiceImpl.MessageServiceImpl;
import com.whatsappClone.ServiceImpl.UserServiceImpl;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    @Autowired
    private MessageServiceImpl messageService;

    @Autowired
    private UserServiceImpl userService;

    @PostMapping("/create")
    public ResponseEntity<Message> sendMessageHandler(@RequestBody SendMessageRequest sendMessageRequest,
            @RequestHeader("Authorization") String jwt) throws UserException, ChatException {

        User user = this.userService.findUserProfile(jwt);

        sendMessageRequest.setUserId(user.getId());

        Message message = this.messageService.sendMessage(sendMessageRequest);

        return new ResponseEntity<Message>(message, HttpStatus.OK);
    }

    @GetMapping("/{chatId}")
    public ResponseEntity<List<Message>> getChatMessageHandler(@PathVariable Integer chatId,
            @RequestHeader("Authorization") String jwt) throws UserException, ChatException {

        User user = this.userService.findUserProfile(jwt);

        List<Message> messages = this.messageService.getChatsMessages(chatId, user);

        return new ResponseEntity<List<Message>>(messages, HttpStatus.OK);
    }

    @DeleteMapping("/{messageId}")
    public ResponseEntity<ApiResponse> deleteMessageHandler(@PathVariable Integer messageId,
            @RequestHeader("Authorization") String jwt) throws UserException, ChatException, MessageException {

        User user = this.userService.findUserProfile(jwt);

        this.messageService.deleteMessage(messageId, user);

        ApiResponse res = new ApiResponse("Deleted successfully......", false);

        return new ResponseEntity<>(res, HttpStatus.OK);
    }

@PostMapping("/upload")
public ResponseEntity<String> uploadMedia(@RequestParam("file") MultipartFile file, @RequestHeader("Authorization") String jwt)
        throws IOException, UserException {


    String uploadDir = "C:/projects/Whatsapp-clone-main/backend/uploads/media/"; // ✅ full path

    File dir = new File(uploadDir);
    if (!dir.exists()) {
        dir.mkdirs();
    }

    // Save file to that folder
    String filePath = uploadDir + file.getOriginalFilename();
    File dest = new File(filePath);
    file.transferTo(dest);

    // Return relative URL (your frontend needs to know this path is public)
    String fileUrl = "/uploads/media/" + file.getOriginalFilename();
    return ResponseEntity.ok(fileUrl);
}



}
